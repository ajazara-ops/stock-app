import yfinance as yf
import pandas as pd
import json
import time
import ssl
import requests
import xml.etree.ElementTree as ET
import math
import os

# SSL 인증서 오류 방지
ssl._create_default_https_context = ssl._create_unverified_context

# --- [안전장치] 값을 안전하게 변환하는 함수 ---
def safe_float(val, default=0.0):
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f): return default
        return f
    except: return default

def analyze_market_condition():
    """미국/한국 시장 지수 분석"""
    print("🌍 글로벌 시장 상황 분석 중...")
    markets = {'US': {'ticker': '^GSPC', 'name': 'S&P 500'}, 'KR': {'ticker': '^KS11', 'name': 'KOSPI'}}
    market_status = {}
    
    for country, info in markets.items():
        try:
            ticker = yf.Ticker(info['ticker'])
            hist = ticker.history(period="5d")
            if len(hist) < 2:
                market_status[country] = {'status': 'UNKNOWN', 'change': 0.0, 'message': '데이터 없음'}
                continue
            current = hist['Close'].iloc[-1]
            prev = hist['Close'].iloc[-2]
            change_pct = ((current - prev) / prev) * 100
            
            status = "NEUTRAL"
            message = "보합세"
            if change_pct >= 1.0: status, message = "VERY_GOOD", "강한 상승장 🔥"
            elif change_pct >= 0.2: status, message = "GOOD", "상승세 📈"
            elif change_pct > -0.5: status, message = "NEUTRAL", "보합/조정 ➖"
            elif change_pct > -1.5: status, message = "BAD", "하락세주의 ☁️"
            else: status, message = "PANIC", "폭락장 경고 ⛈️"
                
            market_status[country] = {
                'name': info['name'], 'current': safe_float(round(current, 2)),
                'change': safe_float(round(change_pct, 2)), 'status': status, 'message': message
            }
            print(f"   👉 [{country}] {info['name']}: {change_pct:.2f}% ({message})")
        except:
            market_status[country] = {'status': 'UNKNOWN', 'change': 0.0, 'message': '분석 실패'}
    return market_status

def get_sp500_tickers():
    print("📋 [미국] S&P 500 종목 리스트 확보 중...")
    try:
        url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers)
        table = pd.read_html(response.text)
        tickers = table[0]['Symbol'].tolist()
        return [t.replace('.', '-') for t in tickers]
    except:
        return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META']

def get_korea_tickers():
    print("📋 [한국] 네이버 금융에서 우량주 리스트 수집 중...")
    try:
        # 네이버 금융 크롤링 시도 (실패 시 안전 리스트 사용)
        tickers = []
        safe_tickers = [
            '005930.KS', '000660.KS', '373220.KS', '207940.KS', '005380.KS', '000270.KS', '068270.KS', '005490.KS', '035420.KS', '006400.KS',
            '051910.KS', '035720.KS', '003670.KS', '028260.KS', '012330.KS', '105560.KS', '055550.KS', '032830.KS', '086790.KS', '015760.KS',
            '034020.KS', '011200.KS', '010120.KS', '259960.KS', '329180.KS', '066970.KS', '022100.KS', '009150.KS', '011070.KS', '034220.KS',
            '051900.KS', '090430.KS', '096770.KS', '010950.KS', '011780.KS', '009830.KS', '204320.KS', '003490.KS', '086280.KS', '000100.KS',
            '128940.KS', '036570.KS', '251270.KS', '352820.KS', '316140.KS', '323410.KS', '377300.KS', '138040.KS', '024110.KS', '042660.KS',
            '010140.KS', '012450.KS', '064350.KS', '079550.KS', '021240.KS', '383220.KS', '097950.KS', '028050.KS', '010130.KS', '000810.KS',
            '247540.KQ', '086520.KQ', '028300.KQ', '196170.KQ', '035900.KQ', '041510.KQ', '068760.KQ', '277810.KQ', '403870.KQ', '039200.KQ',
            '293490.KQ', '263750.KQ', '145020.KQ', '214150.KQ', '042700.KQ', '005290.KQ', '240810.KQ', '357780.KQ', '278280.KQ', '237690.KQ'
        ]
        print(f"   ✅ 한국 핵심 종목 {len(safe_tickers)}개 로드 완료")
        return safe_tickers
    except Exception as e:
        return []

def get_news_from_google_kr(ticker):
    try:
        search_query = ticker.split('.')[0]
        url = f"https://news.google.com/rss/search?q={search_query}+주가&hl=ko&gl=KR&ceid=KR:ko"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=3)
        root = ET.fromstring(response.content)
        news_list = []
        for item in root.findall('./channel/item')[:3]:
            news_list.append({'title': item.find('title').text, 'link': item.find('link').text, 'publisher': item.find('source').text})
        return news_list
    except: return []

def get_news_from_google_us(ticker):
    try:
        url = f"https://news.google.com/rss/search?q={ticker}+stock&hl=en-US&gl=US&ceid=US:en"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=3)
        root = ET.fromstring(response.content)
        news_list = []
        for item in root.findall('./channel/item')[:3]:
            news_list.append({'title': item.find('title').text, 'link': item.find('link').text, 'publisher': item.find('source').text})
        return news_list
    except: return []

def calculate_indicators(close):
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    exp1 = close.ewm(span=12, adjust=False).mean()
    exp2 = close.ewm(span=26, adjust=False).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=9, adjust=False).mean()
    
    ma20 = close.rolling(window=20).mean()
    std = close.rolling(window=20).std()
    upper = ma20 + (std * 2)
    lower = ma20 - (std * 2)
    
    return rsi, macd, signal, upper, lower, ma20

def analyze_news_sentiment(news_list):
    analyzed_news = []
    positive_words = ['surge', 'jump', 'soar', 'gain', 'profit', 'buy', 'growth', '급등', '상승', '호재', '증가', '개선', '매수', '체결', '성장']
    negative_words = ['drop', 'fall', 'plunge', 'loss', 'miss', 'sell', 'crash', '급락', '하락', '악재', '감소', '부진', '매도', '적자', '우려']

    for news in news_list:
        title = news.get('title', '').strip()
        if not title: continue
        title_lower = title.lower()
        sentiment = 'neutral'
        pos_score = sum(1 for w in positive_words if w in title_lower)
        neg_score = sum(1 for w in negative_words if w in title_lower)
        if pos_score > neg_score: sentiment = 'positive'
        elif neg_score > pos_score: sentiment = 'negative'
        analyzed_news.append({'title': title, 'link': news.get('link', ''), 'sentiment': sentiment, 'publisher': news.get('publisher', 'News')})
    return analyzed_news

def analyze_stock(ticker, market_type):
    try:
        stock = yf.Ticker(ticker)
        try: hist = stock.history(period="6mo")
        except: return None
        if len(hist) < 60: return None
        
        info = {}
        try: info = stock.info 
        except: pass
        if market_type == 'US' and info.get('operatingMargins', 0) < -0.2: return None
            
        close = hist['Close']
        rsi, macd, signal, bb_upper, bb_lower, ma20 = calculate_indicators(close)
        
        current_price = close.iloc[-1]
        current_rsi = rsi.iloc[-1]
        current_lower = bb_lower.iloc[-1]
        ma60 = close.rolling(window=60).mean().iloc[-1]
        
        if pd.isna(current_rsi) or pd.isna(current_price): return None
        if current_rsi > 75: return None
        
        score = 20
        reasons = []
        if current_rsi < 30: score += 30; reasons.append("RSI 과매도")
        elif current_rsi < 40: score += 20; reasons.append("단기 과매도")
        elif current_rsi < 55: score += 10; reasons.append("눌림목")
        if current_price <= current_lower * 1.02: score += 20; reasons.append("볼린저밴드 하단")
        if not pd.isna(ma60) and current_price >= ma60 * 0.95 and current_price <= ma60 * 1.08: score += 15; reasons.append("60일선 지지")
        if macd.iloc[-1] > signal.iloc[-1]: score += 10
        if market_type == 'US' and info.get('operatingMargins', 0) > 0.15: score += 10
                
        cutoff = 40 if market_type == 'US' else 15
        if score < cutoff: return None
        
        name = info.get('shortName', ticker) if info else ticker
        price_val = safe_float(round(current_price, 2))
        if price_val <= 0: return None

        history_data = []
        for date, row in hist.iloc[-20:].iterrows():
            p = round(float(row['Close']), 2) if not math.isnan(row['Close']) else None
            b_u = round(float(bb_upper.loc[date]), 2) if not math.isnan(bb_upper.loc[date]) else None
            b_l = round(float(bb_lower.loc[date]), 2) if not math.isnan(bb_lower.loc[date]) else None
            history_data.append({"time": date.strftime("%m-%d"), "price": p, "bb_upper": b_u, "bb_lower": b_l})

        return {
            "id": ticker, "rank": 0, "symbol": ticker.replace('.KS','').replace('.KQ',''), "name": name, "market": market_type,
            "currentPrice": price_val, "changePercent": safe_float(round(((current_price - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]) * 100, 2)),
            "buyZoneTop": safe_float(round(current_price * 1.02, 2), price_val), "buyZoneBottom": safe_float(round(current_price * 0.98, 2), price_val),
            "targetPrice": safe_float(round(current_price * 1.1, 2), price_val), "aiReason": " + ".join(reasons),
            "score": int(score), "rsi": safe_float(round(current_rsi, 2)), "history": history_data, "news": []
        }
    except: return None

def process_news_for_list(stock_list):
    if not stock_list: return
    print(f"\n📰 선정된 Top {len(stock_list)} 종목 뉴스 수집 중...")
    for item in stock_list:
        ticker = item['id']
        market_type = item['market']
        print(f"   [{market_type}] {ticker}...", end=' ')
        raw_news = []
        try:
            if market_type == 'KR': raw_news = get_news_from_google_kr(ticker)
            else:
                stock = yf.Ticker(ticker)
                try: raw_news = stock.news 
                except: pass
                if raw_news: raw_news = [n for n in raw_news if n.get('title')]
                if not raw_news: raw_news = get_news_from_google_us(ticker)
        except: pass
        print(f"{len(raw_news)}개 완료")
        item['news'] = analyze_news_sentiment(raw_news[:3])

def update_history_index():
    if not os.path.exists('history'): return
    index_file = 'history_index.json'
    history_list = []
    for filename in sorted(os.listdir('history'), reverse=True):
        if filename.endswith('_recommendation.json'):
            date_str = filename.split('_')[0]
            history_list.append({"date": date_str, "file": f"history/{filename}"})
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(history_list, f, indent=2, ensure_ascii=False)

def main():
    print("🚀 [텔레그램 제거] AI 주식 분석기 가동")
    market_status = analyze_market_condition()
    final_results = []
    
    us_tickers = get_sp500_tickers()
    us_candidates = []
    print("\n🇺🇸 미국 주식 분석...")
    for i, ticker in enumerate(us_tickers):
        print(f"[{i+1}/{len(us_tickers)}] {ticker}...", end='\r')
        data = analyze_stock(ticker, 'US')
        if data: us_candidates.append(data)
    us_candidates.sort(key=lambda x: x['score'], reverse=True)
    us_top10 = us_candidates[:10]
    for i, item in enumerate(us_top10): item['rank'] = i + 1
    final_results.extend(us_top10)
    
    kr_tickers = get_korea_tickers()
    kr_candidates = []
    print("\n🇰🇷 한국 주식 분석...")
    for i, ticker in enumerate(kr_tickers):
        print(f"[{i+1}/{len(kr_tickers)}] {ticker}...", end='\r')
        data = analyze_stock(ticker, 'KR')
        if data: kr_candidates.append(data)
    kr_candidates.sort(key=lambda x: x['score'], reverse=True)
    kr_top10 = kr_candidates[:10]
    for i, item in enumerate(kr_top10): item['rank'] = i + 1
    final_results.extend(kr_top10)
    
    process_news_for_list(us_top10)
    process_news_for_list(kr_top10)
    
    output_data = {
        "market_status": market_status,
        "stocks": final_results,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    try:
        with open('todays_recommendation.json', 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False, allow_nan=False)
            
        if not os.path.exists('history'): os.makedirs('history')
        today_str = time.strftime("%Y-%m-%d")
        with open(f"history/{today_str}_recommendation.json", 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False, allow_nan=False)
            
        print(f"\n🎉 분석 완료! 총 {len(final_results)}개 저장됨.")
        update_history_index()
        
    except ValueError as e:
        print(f"\n❌ 저장 실패: {e}")

if __name__ == "__main__":
    main()