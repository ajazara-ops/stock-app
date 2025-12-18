import yfinance as yf
import pandas as pd
import json
import time
import ssl
import requests
import xml.etree.ElementTree as ET
import math
import os
import sys
from collections import Counter
from datetime import datetime, timedelta

# SSL 인증서 오류 방지
ssl._create_default_https_context = ssl._create_unverified_context

# --- [안전장치] ---
def safe_float(val, default=0.0):
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f): return default
        return f
    except: return default

# --- [알림 전송 함수] ---
def send_push_notification(title, message):
    # ✅ 사용자님의 푸시 토큰을 여기에 넣었습니다.
    user_push_tokens = ["ExponentPushToken[kip5csOC92Ymcc_AtKjqyl]"] 

    if not user_push_tokens:
        print(f"⚠️ [알림 시뮬레이션] 전송할 토큰 없음. 메시지 내용 미리보기:\n제목: {title}\n내용: {message}")
        return

    url = "https://exp.host/--/api/v2/push/send"
    headers = {
        "host": "exp.host",
        "accept": "application/json",
        "accept-encoding": "gzip, deflate",
        "content-type": "application/json"
    }

    print(f"📨 알림 전송 시도: {title}")
    for token in user_push_tokens:
        payload = {
            "to": token,
            "title": title,
            "body": message,
            "sound": "default",
            "priority": "high"
        }
        try:
            requests.post(url, headers=headers, data=json.dumps(payload))
        except Exception as e:
            print(f"  ❌ 전송 에러: {e}")

# --- [어제 추천 종목 가져오기] ---
def get_latest_recommendation_ids():
    """history 폴더에서 가장 최근(오늘 제외) 파일의 종목 ID 집합을 반환"""
    if not os.path.exists('history'): return set()
    
    # 날짜 역순 정렬 (최신 파일이 앞으로)
    files = sorted([f for f in os.listdir('history') if f.endswith('_recommendation.json')], reverse=True)
    
    if not files: return set()
    
    # 가장 최근 파일 읽기
    try:
        with open(f"history/{files[0]}", 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {s['id'] for s in data.get('stocks', [])}
    except:
        return set()

# --- [1] 시장 상황 분석 ---
def analyze_market_condition():
    print("🌍 글로벌 시장 상황 분석 중...")
    markets = {'US': {'ticker': '^GSPC', 'name': 'S&P 500'}, 'KR': {'ticker': '^KS11', 'name': 'KOSPI'}, 'VIX': {'ticker': '^VIX', 'name': '공포지수'}}
    market_status = {}
    for key, info in markets.items():
        try:
            ticker = yf.Ticker(info['ticker'])
            hist = ticker.history(period="5d")
            if len(hist) < 2:
                market_status[key] = {'status': 'UNKNOWN', 'change': 0.0, 'current': 0.0, 'message': '데이터 없음'}
                continue
            current = hist['Close'].iloc[-1]; prev = hist['Close'].iloc[-2]
            change_pct = ((current - prev) / prev) * 100
            status, message = "NEUTRAL", ""
            
            if key == 'VIX':
                if current >= 30: status, message = "PANIC", "극도의 공포 😱"
                elif current >= 20: status, message = "BAD", "공포 구간 😨"
                elif current <= 15: status, message = "VERY_GOOD", "시장 과열 🤑"
                else: status, message = "NEUTRAL", "안정적 😌"
            else:
                if change_pct >= 1.0: status, message = "VERY_GOOD", "강한 상승 🔥"
                elif change_pct >= 0.2: status, message = "GOOD", "상승세 📈"
                elif change_pct > -0.5: status, message = "NEUTRAL", "보합세 ➖"
                elif change_pct > -1.5: status, message = "BAD", "하락세 ☁️"
                else: status, message = "PANIC", "폭락 경고 ⛈️"
                
            market_status[key] = {'name': info['name'], 'current': safe_float(round(current, 2)), 'change': safe_float(round(change_pct, 2)), 'status': status, 'message': message}
        except: market_status[key] = {'status': 'UNKNOWN', 'change': 0.0, 'message': '분석 실패'}
    return market_status

# --- [2] 종목 리스트 ---
def get_sp500_tickers():
    try:
        url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers)
        table = pd.read_html(response.text)
        tickers = table[0]['Symbol'].tolist()
        return [t.replace('.', '-') for t in tickers]
    except: return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META']

def get_korea_tickers():
    return [
        '005930.KS', '000660.KS', '373220.KS', '207940.KS', '005380.KS', '000270.KS', '068270.KS', '005490.KS', '035420.KS', 
        '006400.KS', '051910.KS', '035720.KS', '003670.KS', '028260.KS', '012330.KS', '105560.KS', '055550.KS', '032830.KS', 
        '086790.KS', '015760.KS', '034020.KS', '011200.KS', '010120.KS', '259960.KS', '329180.KS', '011070.KS', '034220.KS',
        '009150.KS', '010950.KS', '011780.KS', '009830.KS', '204320.KS', '003490.KS', '086280.KS', '000100.KS', '128940.KS',
        '247540.KQ', '086520.KQ', '028300.KQ', '196170.KQ', '035900.KQ', '041510.KQ', '068760.KQ', '277810.KQ', '403870.KQ', 
        '039200.KQ', '293490.KQ', '263750.KQ', '145020.KQ', '214150.KQ', '042700.KQ', '005290.KQ', '240810.KQ', '357780.KQ'
    ]

# --- [3] 뉴스 수집 ---
def get_news_from_google_kr(ticker):
    try:
        url = f"https://news.google.com/rss/search?q={ticker.split('.')[0]}+주가&hl=ko&gl=KR&ceid=KR:ko"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=3); root = ET.fromstring(response.content)
        return [{'title': item.find('title').text, 'link': item.find('link').text, 'publisher': item.find('source').text} for item in root.findall('./channel/item')[:3]]
    except: return []

def get_news_from_google_us(ticker):
    try:
        url = f"https://news.google.com/rss/search?q={ticker}+stock&hl=en-US&gl=US&ceid=US:en"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=3); root = ET.fromstring(response.content)
        return [{'title': item.find('title').text, 'link': item.find('link').text, 'publisher': item.find('source').text} for item in root.findall('./channel/item')[:3]]
    except: return []

def analyze_news_sentiment(news_list):
    analyzed = []
    pos = ['surge', 'jump', 'soar', 'gain', 'profit', 'buy', 'growth', 'record', 'upgrade', '급등', '상승', '호재', '증가', '개선', '매수', '체결', '성장', '최고']
    neg = ['drop', 'fall', 'plunge', 'loss', 'miss', 'sell', 'crash', 'downgrade', 'lawsuit', '급락', '하락', '악재', '감소', '부진', '매도', '적자', '우려', '소송']
    for n in news_list:
        t = n.get('title', '').strip(); 
        if not t: continue
        t_l = t.lower(); sent = 'neutral'
        p_sc = sum(1 for w in pos if w in t_l); n_sc = sum(1 for w in neg if w in t_l)
        if p_sc > n_sc: sent = 'positive'
        elif n_sc > p_sc: sent = 'negative'
        analyzed.append({'title': t, 'link': n.get('link',''), 'sentiment': sent, 'publisher': n.get('publisher','News')})
    return analyzed

def process_news_for_list(stock_list):
    if not stock_list: return
    print(f"\n📰 Top {len(stock_list)} 뉴스 수집 중...")
    for item in stock_list:
        ticker = item['id']; mkt = item['market']
        print(f"   [{mkt}] {ticker}...", end=' '); raw = []
        try:
            if mkt == 'KR': raw = get_news_from_google_kr(ticker)
            else: raw = get_news_from_google_us(ticker)
        except: pass
        print(f"{len(raw)}개"); item['news'] = analyze_news_sentiment(raw[:3])

# --- [4] 지표 계산 ---
def calculate_indicators(close):
    delta = close.diff(); gain = (delta.where(delta > 0, 0)).rolling(14).mean(); loss = (-delta.where(delta < 0, 0)).rolling(14).mean(); rs = gain/loss; rsi = 100 - (100/(1+rs))
    exp1 = close.ewm(span=12).mean(); exp2 = close.ewm(span=26).mean(); macd = exp1 - exp2; signal = macd.ewm(span=9).mean()
    ma20 = close.rolling(20).mean(); std = close.rolling(20).std(); upper = ma20 + (std*2); lower = ma20 - (std*2)
    return rsi, macd, signal, upper, lower, ma20

# --- [5] 개별 종목 분석 ---
def analyze_stock(ticker, market_type):
    try:
        stock = yf.Ticker(ticker)
        try: hist = stock.history(period="2y")
        except: return None
        if len(hist) < 60: return None
        
        info = {}
        try: info = stock.info 
        except: pass
        
        if market_type == 'US' and info.get('operatingMargins', 0) < -0.5: return None
        
        close = hist['Close']; volume = hist['Volume']
        rsi, macd, signal, bb_upper, bb_lower, ma20 = calculate_indicators(close)
        
        cur_p = close.iloc[-1]; cur_rsi = rsi.iloc[-1]; cur_low = bb_lower.iloc[-1]; ma60 = close.rolling(60).mean().iloc[-1]
        vol_ma20 = volume.rolling(20).mean().iloc[-1]; cur_vol = volume.iloc[-1]
        rvol = safe_float(cur_vol / vol_ma20, 1.0) if vol_ma20 > 0 else 1.0
        
        sector = info.get('sector', '기타')
        if market_type == 'KR' and sector == '기타':
            if ticker in ['005930.KS', '000660.KS']: sector = 'Technology'
            elif ticker in ['005380.KS', '000270.KS']: sector = 'Automotive'
            
        if pd.isna(cur_rsi) or pd.isna(cur_p) or cur_rsi > 80: return None
        
        score = 40; reasons = [] 
        if cur_rsi < 30: score += 30; reasons.append("RSI 과매도")
        elif cur_rsi < 45: score += 20; reasons.append("단기 과매도")
        elif cur_rsi < 60: score += 10; reasons.append("눌림목")
        if cur_p <= cur_low * 1.05: score += 20; reasons.append("볼린저밴드 하단 근접")
        if not pd.isna(ma60) and cur_p >= ma60 * 0.95 and cur_p <= ma60 * 1.08: score += 15; reasons.append("60일선 지지")
        if macd.iloc[-1] > signal.iloc[-1]: score += 10
        if rvol >= 1.2: score += 15; reasons.append(f"거래량 증가({rvol:.1f}배)")
        
        if market_type == 'US':
            op_margin = info.get('operatingMargins', 0)
            rev_growth = info.get('revenueGrowth', 0)
            per = info.get('forwardPE', 0)
            if op_margin > 0.10: score += 5; reasons.append("영업이익률 우수")
            if rev_growth > 0.05: score += 5; reasons.append("매출 고성장")
            if per > 0 and per < 40: score += 5; reasons.append("적정 PER")
        elif market_type == 'KR':
            score += 5; reasons.append("재무 건전성 양호")
        
        cutoff = 25 if market_type == 'US' else 10 
        if score < cutoff: return None
        
        name = info.get('shortName', ticker) if info else ticker
        price_val = safe_float(round(cur_p, 2))
        
        hist_data = []
        for d, r in hist.iloc[-20:].iterrows():
            p = round(float(r['Close']), 2) if not math.isnan(r['Close']) else None
            b_u = round(float(bb_upper.loc[d]), 2) if not math.isnan(bb_upper.loc[d]) else None
            b_l = round(float(bb_lower.loc[d]), 2) if not math.isnan(bb_lower.loc[d]) else None
            hist_data.append({"time": d.strftime("%m-%d"), "price": p, "bb_upper": b_u, "bb_lower": b_l})

        return {
            "id": ticker, "rank": 0, "symbol": ticker.replace('.KS','').replace('.KQ',''), "name": name, "market": market_type,
            "currentPrice": price_val,
            "changePercent": safe_float(round(((cur_p - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]) * 100, 2)),
            "buyZoneTop": safe_float(round(cur_p * 1.02, 2), price_val), "buyZoneBottom": safe_float(round(cur_p * 0.98, 2), price_val),
            "targetPrice": safe_float(round(cur_p * 1.1, 2), price_val), "aiReason": " + ".join(reasons),
            "score": int(score), "rsi": safe_float(round(cur_rsi, 2)), "history": hist_data, "news": [],
            "financials": {"op_margin": safe_float(info.get('operatingMargins', 0)), "rev_growth": safe_float(info.get('revenueGrowth', 0)), "per": safe_float(info.get('forwardPE', 0))},
            "sector": sector, "rvol": safe_float(round(rvol, 2))
        }
    except: return None

# --- [6] 주간 종합 리포트 생성 ---
def generate_weekly_report(today_str):
    print(f"\n📊 [Weekly] 지난 2주간({today_str} 기준)의 통합 성과 분석 시작...")
    
    # 1. 지난 14일간의 파일 찾기
    history_files = []
    end_date = datetime.strptime(today_str, "%Y-%m-%d")
    start_date = end_date - timedelta(days=14)
    
    if not os.path.exists('history'): 
        print("❌ 히스토리 폴더가 없습니다.")
        return

    for f in os.listdir('history'):
        if f.endswith('_recommendation.json'):
            file_date_str = f.split('_')[0]
            try:
                file_date = datetime.strptime(file_date_str, "%Y-%m-%d")
                if start_date <= file_date < end_date: # 오늘 제외, 과거 14일
                    history_files.append(f)
            except: pass
            
    print(f"📂 분석 대상 파일: {len(history_files)}개 ({history_files})")
    
    # 2. 모든 추천 종목 수집
    aggregated_stocks = []
    
    for file in history_files:
        with open(f"history/{file}", 'r', encoding='utf-8') as f:
            data = json.load(f)
            rec_date = file.split('_')[0] # 추천일
            for stock in data.get('stocks', []):
                stock['buyPrice'] = stock['currentPrice'] 
                stock['recommendDate'] = rec_date
                aggregated_stocks.append(stock)

    print(f"🔎 총 {len(aggregated_stocks)}개의 과거 추천 내역 분석 중...")

    # 3. 현재가 조회 및 수익률 계산
    final_results = []
    
    for i, item in enumerate(aggregated_stocks):
        ticker = item['id']
        buy_price = item['buyPrice']
        print(f"[{i+1}/{len(aggregated_stocks)}] 수익률 계산: {ticker}...", end='\r')
        
        try:
            stock_info = yf.Ticker(ticker)
            todays_data = stock_info.history(period="5d")
            if len(todays_data) > 0:
                current_price = float(todays_data['Close'].iloc[-1])
                return_rate = ((current_price - buy_price) / buy_price) * 100
                
                item['currentPrice'] = round(current_price, 2)
                item['returnRate'] = round(return_rate, 2)
                final_results.append(item)
        except Exception as e:
            pass 

    # 4. 수익률 순으로 정렬
    final_results.sort(key=lambda x: x['returnRate'], reverse=True)
    top_performers = final_results[:10]
    
    for i, item in enumerate(top_performers):
        item['rank'] = i + 1
        
    ms = analyze_market_condition()
    
    out = {
        "market_status": ms, 
        "stocks": top_performers, 
        "dominant_sectors": [], 
        "timestamp": f"{today_str} 08:00:00 (Weekly Report)"
    }
    
    with open(f"history/{today_str}_recommendation.json", 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2, ensure_ascii=False, allow_nan=False)
        
    print(f"\n✅ 주간 종합 리포트 생성 완료! (상위 {len(top_performers)}개 저장)")

def update_history_index():
    if not os.path.exists('history'): return
    hl = []
    for f in sorted(os.listdir('history'), reverse=True):
        if f.endswith('_recommendation.json'): 
            d_str = f.split('_')[0]
            hl.append({"date": d_str, "file": f"history/{f}"})
    with open('history_index.json', 'w', encoding='utf-8') as f: json.dump(hl, f, indent=2, ensure_ascii=False)

def main():
    mode = 'daily'
    if len(sys.argv) > 1 and sys.argv[1] == '--mode':
        if len(sys.argv) > 2: mode = sys.argv[2]
            
    today_str = time.strftime("%Y-%m-%d")
    print(f"🚀 AI 주식 분석기 가동 (모드: {mode}, 날짜: {today_str})")

    if mode == 'daily':
        # 1. 어제 추천 종목 리스트 가져오기 (비교용)
        prev_stock_ids = get_latest_recommendation_ids()

        # [평일] 기존 로직: 오늘 추천 종목 선정
        ms = analyze_market_condition(); final = []
        
        us = get_sp500_tickers(); usc = []
        print("\n🇺🇸 미국 분석..."); 
        for i, t in enumerate(us): 
            print(f"[{i+1}/{len(us)}] {t}...", end='\r'); d = analyze_stock(t, 'US'); 
            if d: usc.append(d)
        usc.sort(key=lambda x: x['score'], reverse=True); ust = usc[:10]
        for i, item in enumerate(ust): item['rank'] = i + 1
        final.extend(ust)
        
        kr = get_korea_tickers(); krc = []
        print("\n🇰🇷 한국 분석..."); 
        for i, t in enumerate(kr): 
            print(f"[{i+1}/{len(kr)}] {t}...", end='\r'); d = analyze_stock(t, 'KR'); 
            if d: krc.append(d)
        krc.sort(key=lambda x: x['score'], reverse=True); krt = krc[:10]
        for i, item in enumerate(krt): item['rank'] = i + 1
        final.extend(krt)
        
        process_news_for_list(ust); process_news_for_list(krt)
        
        all_sectors = [s['sector'] for s in final if s['sector'] != '기타']
        dominant_sectors = [item[0] for item in Counter(all_sectors).most_common(2)]
        
        out = {"market_status": ms, "stocks": final, "dominant_sectors": dominant_sectors, "timestamp": f"{today_str} 16:00:00"}
        
        print("\n💾 [Daily Mode] 오늘의 추천 종목 갱신 중...")
        with open('todays_recommendation.json', 'w', encoding='utf-8') as f: json.dump(out, f, indent=2, ensure_ascii=False, allow_nan=False)

        # 2. 신규 진입 종목 필터링 및 메시지 생성
        new_stocks = [s['symbol'] for s in final if s['id'] not in prev_stock_ids]
        
        noti_title = "🔔 DailyPick10 알림"
        if new_stocks:
            # 신규 종목이 있을 경우: 신규 종목 위주로 메시지 구성
            highlight_stocks = ", ".join(new_stocks[:2]) # 최대 2개만 표시
            noti_body = f"오늘의 추천 종목이 도착하였습니다! 오늘의 추천: {highlight_stocks} 등 {len(final)}건 (신규 {len(new_stocks)}건)"
        else:
            # 신규 종목이 없을 경우: 상위 1, 2위 종목 표시
            top_stocks = ", ".join([s['symbol'] for s in final[:2]])
            noti_body = f"오늘의 추천 종목이 도착하였습니다! 오늘의 추천: {top_stocks} 등 {len(final)}건 (순위 변동)"

        # 3. 알림 전송
        send_push_notification(noti_title, noti_body)

    elif mode == 'weekly':
        # [토요일] 신규 로직: 지난 2주간 데이터 취합 및 성과 분석
        generate_weekly_report(today_str)
        update_history_index()

    print(f"\n✅ 완료되었습니다.")

if __name__ == "__main__": main()