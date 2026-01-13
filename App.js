import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  SafeAreaView, StatusBar, Modal, ActivityIndicator, Dimensions, Linking, Alert
} from 'react-native';
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';

// ⚠️ 중요: 본인의 데이터가 호스팅된 URL을 입력하세요 (예: GitHub Pages)
const DATA_URL = "[https://ajazara-ops.github.io/stock-app/todays_recommendation.json](https://ajazara-ops.github.io/stock-app/todays_recommendation.json)"; 

// --- [1] 아이콘 컴포넌트 ---
const Icon = ({ name, size = 24, color = "#9CA3AF" }) => {
  const props = { width: size, height: size, stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  
  switch (name) {
    case 'swing': return <Svg {...props}><Path d="M2 15c3.33-6 6.67-6 10 0s6.67 6 10 0"/><Path d="M17 5l5 0 0 5"/></Svg>;
    case 'arrowRight': return <Svg {...props}><Line x1="5" y1="12" x2="19" y2="12"/><Polyline points="12 5 19 12 12 19"/></Svg>;
    case 'arrowLeft': return <Svg {...props}><Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/></Svg>;
    case 'refresh': return <Svg {...props}><Path d="M21.5 2v6h-6"/><Path d="M2.5 22v-6h6"/><Path d="M2 11.5a10 10 0 0 1 18.8-4.3"/><Path d="M22 12.5a10 10 0 0 1-18.8 4.3"/></Svg>;
    case 'shield': return <Svg {...props}><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>;
    case 'thumbsUp': return <Svg {...props}><Path d="M7 10v12"/><Path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></Svg>;
    case 'thumbsDown': return <Svg {...props}><Path d="M17 14V2"/><Path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></Svg>;
    case 'home': return <Svg {...props}><Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline points="9 22 9 12 15 12 15 22"/></Svg>;
    case 'history': return <Svg {...props}><Path d="M3 3v5h5"/><Path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><Path d="M12 7v5l4 2"/></Svg>;
    case 'bell': return <Svg {...props}><Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Svg>;
    case 'bellDot': return <Svg {...props}><Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><Circle cx="18" cy="8" r="3" fill="#ef4444" stroke="none"/></Svg>;
    case 'dollar': return <Svg {...props}><Rect width="20" height="12" x="2" y="6" rx="2"/><Circle cx="12" cy="12" r="2"/><Path d="M6 12h.01M18 12h.01"/></Svg>;
    case 'star': return <Svg {...props}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
    case 'starFilled': return <Svg {...props} fill={color}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
    case 'calendar': return <Svg {...props}><Rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><Line x1="16" y1="2" x2="16" y2="6"/><Line x1="8" y1="2" x2="8" y2="6"/><Line x1="3" y1="10" x2="21" y2="10"/></Svg>;
    case 'activity': return <Svg {...props}><Polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Svg>;
    case 'zap': return <Svg {...props}><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>;
    case 'pie': return <Svg {...props}><Path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><Path d="M22 12A10 10 0 0 0 12 2v10z"/></Svg>;
    case 'alert': return <Svg {...props}><Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><Line x1="12" y1="9" x2="12" y2="13"/><Line x1="12" y1="17" x2="12.01" y2="17"/></Svg>;
    case 'globe': return <Svg {...props}><Circle cx="12" cy="12" r="10"/><Line x1="2" y1="12" x2="22" y2="12"/><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>;
    case 'chart': return <Svg {...props}><Line x1="18" y1="20" x2="18" y2="10"/><Line x1="12" y1="20" x2="12" y2="4"/><Line x1="6" y1="20" x2="6" y2="14"/></Svg>;
    default: return null;
  }
};

const FALLBACK_DATA = [
  { id: 'us1', rank: 1, symbol: 'PLTR', name: 'Palantir', market: 'US', currentPrice: 22.5, changePercent: 1.2, buyZoneTop: 23, buyZoneBottom: 21, targetPrice: 28, aiReason: 'RSI 과매도 + 골든크로스 + 매출 고성장', history: [], score: 85, rsi: 32, news: [], rvol: 2.5, sector: "Technology", financials: { op_margin: 0.2, rev_growth: 0.15, per: 45 } },
  { id: 'kr1', rank: 1, symbol: '005930', name: '삼성전자', market: 'KR', currentPrice: 72500, changePercent: -0.5, buyZoneTop: 73000, buyZoneBottom: 71000, targetPrice: 80000, aiReason: '외국인 수급 유입 + 60일선 지지', history: [], score: 75, rsi: 45, news: [], rvol: 1.2, sector: "Technology", financials: { op_margin: 0.1, rev_growth: -0.05, per: 12 } }
];

export default function App() {
  const [stocks, setStocks] = useState([]);
  const [marketStatus, setMarketStatus] = useState(null);
  const [dominantSectors, setDominantSectors] = useState([]);
  const [activeTab, setActiveTab] = useState('US');
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [activeView, setActiveView] = useState('HOME');
  const [showSplash, setShowSplash] = useState(true);

  // 초기화
  useEffect(() => {
    // 스플래시 화면 타이머
    setTimeout(() => setShowSplash(false), 2000);

    const init = async () => {
      try {
        const savedFavs = await AsyncStorage.getItem('myFavorites');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
        fetchStockData();
      } catch (e) { console.warn(e); }
    };
    init();
  }, []);

  const toggleFavorite = async (stock) => {
    let newFavs;
    const exists = favorites.some(fav => fav.id === stock.id);
    if (exists) newFavs = favorites.filter(fav => fav.id !== stock.id);
    else newFavs = [...favorites, stock];
    setFavorites(newFavs);
    await AsyncStorage.setItem('myFavorites', JSON.stringify(newFavs));
  };

  const fetchStockData = async () => {
    setLoading(true);
    try {
      // 캐시 방지용 타임스탬프
      const response = await fetch(`${DATA_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error("Data Error");
      const data = await response.json();
      
      if (data.stocks) {
        setStocks(data.stocks);
        setMarketStatus(data.market_status);
        setDominantSectors(data.dominant_sectors || []);
        setError(false);
      } else {
        throw new Error("Format Error");
      }
    } catch (err) {
      console.log("Load Failed, using fallback");
      setError(true);
      if(stocks.length === 0) setStocks(FALLBACK_DATA);
    } finally {
      setLoading(false);
    }
  };

  // 데이터 필터링
  const displayStocks = useMemo(() => {
    if (activeView !== 'HOME') return [];
    if (activeTab === 'FAV') {
      return favorites.map(fav => {
        const latest = stocks.find(s => s.id === fav.id);
        return latest ? { ...latest, rank: latest.rank } : { ...fav, rank: null };
      });
    }
    return stocks.filter(stock => stock.market === activeTab);
  }, [activeTab, stocks, activeView, favorites]);

  // 스플래시 화면 렌더링
  if (showSplash) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.splashIcon}>
          <Icon name="swing" size={60} color="#fff" />
        </View>
        <Text style={styles.splashTitle}>Daily<Text style={{color:'#818CF8'}}>Pick10</Text></Text>
        <Text style={styles.splashSub}>AI 스마트 스윙 투자</Text>
      </View>
    );
  }

  // 메인 화면
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. 상단 헤더 (고정) */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.logoText}>Daily<Text style={{color:'#818CF8'}}>Pick10</Text></Text>
          <TouchableOpacity onPress={fetchStockData} style={styles.iconBtn}>
            {loading ? <ActivityIndicator size="small" color="#9CA3AF" /> : <Icon name="refresh" size={20} color="#9CA3AF" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. 메인 컨텐츠 영역 (스크롤 가능) */}
      {activeView === 'HOME' ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={{paddingBottom: 20}}>
          
          {/* 시장 배너 */}
          {marketStatus && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerScroll}>
              {['US', 'KR', 'VIX'].map(key => {
                const m = marketStatus[key];
                if (!m) return null;
                const isPanic = m.status === 'PANIC';
                return (
                  <View key={key} style={[styles.marketBadge, isPanic && styles.panicBadge]}>
                    <Text style={styles.marketTitle}>{m.name}</Text>
                    <View style={styles.row}>
                      <Text style={styles.marketValue}>{m.current}</Text>
                      {key !== 'VIX' && (
                        <Text style={[styles.marketChange, {color: m.change>=0 ? '#EF4444':'#3B82F6'}]}>
                          {m.change > 0 ? '+' : ''}{m.change}%
                        </Text>
                      )}
                    </View>
                    <Text style={styles.marketMsg}>{m.message}</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* 탭 버튼 */}
          <View style={styles.tabContainer}>
            {['US', 'KR', 'FAV'].map(tab => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabBtn, activeTab===tab && styles.activeTabBtn]}>
                 <Icon name={tab==='US'?'globe':tab==='KR'?'chart':'starFilled'} size={14} color={activeTab===tab?'#fff':'#9CA3AF'} />
                 <Text style={[styles.tabText, activeTab===tab && styles.activeTabText]}>
                   {tab==='US'?'미국':tab==='KR'?'한국':'내 종목'}
                 </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 종목 리스트 */}
          {displayStocks.length === 0 ? (
            <View style={styles.emptyView}>
               <Icon name="star" size={40} color="#374151" />
               <Text style={styles.emptyText}>{activeTab==='FAV'?'관심 종목이 없습니다.':'데이터가 없습니다.'}</Text>
            </View>
          ) : (
            displayStocks.map((stock, idx) => (
              <TouchableOpacity key={idx} style={styles.stockCard} onPress={() => setSelectedStock(stock)}>
                {/* 뱃지 */}
                <View style={[styles.rankBadge, !stock.rank && {backgroundColor:'#4B5563'}]}>
                  <Text style={styles.rankText}>{stock.rank ? `TOP ${stock.rank}` : '제외됨'}</Text>
                </View>
                {/* RVOL 뱃지 */}
                {stock.rvol >= 1.5 && (
                  <View style={styles.volBadge}>
                    <Icon name="zap" size={10} color="#fff" />
                    <Text style={styles.volText}>Vol {stock.rvol}x</Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                   <View>
                      <View style={styles.row}>
                        <Text style={styles.symbolText}>{stock.symbol}</Text>
                        {favorites.some(f=>f.id===stock.id) && <Icon name="starFilled" size={14} color="#FBBF24" />}
                      </View>
                      <View style={styles.row}>
                        {stock.sector && stock.sector !== 'Unknown' && <Text style={styles.sectorText}>{stock.sector}</Text>}
                      </View>
                   </View>
                   <View style={{alignItems:'flex-end'}}>
                      <Text style={styles.priceText}>{stock.market==='US'?'$':'₩'}{stock.currentPrice.toLocaleString()}</Text>
                      <Text style={{color: stock.changePercent>=0?'#EF4444':'#3B82F6', fontSize:12, fontWeight:'bold'}}>
                        {stock.changePercent>0?'+':''}{stock.changePercent}%
                      </Text>
                   </View>
                </View>
                
                {/* 추천 사유 */}
                <View style={styles.reasonBox}>
                   <Text style={styles.reasonText} numberOfLines={1}>{stock.aiReason.split('+')[0]}</Text>
                </View>

                {/* 매수 구간 바 */}
                {stock.rank && (
                  <View style={styles.barContainer}>
                     <View style={styles.barFill} />
                     <View style={styles.barDot} />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : activeView === 'HISTORY' ? (
        <View style={styles.center}>
           <Text style={styles.emptyText}>백테스팅 기능 준비 중입니다.</Text>
        </View>
      ) : (
        <View style={styles.center}>
           <Text style={styles.emptyText}>새로운 알림이 없습니다.</Text>
        </View>
      )}

      {/* 3. 하단 네비게이션 (고정) */}
      <View style={styles.bottomNav}>
         <TouchableOpacity onPress={() => setActiveView('HOME')} style={styles.navBtn}>
           <Icon name="home" color={activeView==='HOME'?'#60A5FA':'#6B7280'} size={26} />
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setActiveView('HISTORY')} style={styles.navBtn}>
           <Icon name="history" color={activeView==='HISTORY'?'#60A5FA':'#6B7280'} size={26} />
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setActiveView('NOTIFICATIONS')} style={styles.navBtn}>
           <Icon name="bell" color={activeView==='NOTIFICATIONS'?'#60A5FA':'#6B7280'} size={26} />
         </TouchableOpacity>
      </View>

      {/* 상세 화면 모달 */}
      <Modal visible={!!selectedStock} animationType="slide" onRequestClose={() => setSelectedStock(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
             <TouchableOpacity onPress={() => setSelectedStock(null)} style={styles.iconBtn}>
               <Icon name="arrowLeft" color="#E5E7EB" />
             </TouchableOpacity>
             <View>
               <Text style={styles.modalTitle}>{selectedStock?.symbol}</Text>
               <Text style={styles.modalSub}>{selectedStock?.name}</Text>
             </View>
             <TouchableOpacity onPress={() => toggleFavorite(selectedStock)} style={styles.iconBtn}>
               <Icon name={favorites.some(f=>f.id===selectedStock?.id)?"starFilled":"star"} color={favorites.some(f=>f.id===selectedStock?.id)?"#FBBF24":"#9CA3AF"} />
             </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
             {/* 전략 카드 */}
             <View style={styles.card}>
                <View style={styles.rowBetween}>
                   <Text style={styles.sectionTitle}>스윙 매매 전략</Text>
                   {selectedStock?.score && <View style={styles.scoreBox}><Text style={styles.scoreText}>AI {selectedStock.score}점</Text></View>}
                </View>
                <View style={styles.grid}>
                   <View style={[styles.gridItem, {backgroundColor:'rgba(239,68,68,0.1)'}]}>
                      <Text style={{color:'#EF4444', fontSize:10, fontWeight:'bold'}}>🎯 1차 익절</Text>
                      <Text style={{color:'#FECACA', fontSize:16, fontWeight:'bold'}}>{selectedStock?.market==='US'?'$':'₩'}{selectedStock && Math.floor(selectedStock.currentPrice*1.05).toLocaleString()}</Text>
                   </View>
                   <View style={[styles.gridItem, {backgroundColor:'rgba(59,130,246,0.1)'}]}>
                      <Text style={{color:'#3B82F6', fontSize:10, fontWeight:'bold'}}>🛡️ 손절가</Text>
                      <Text style={{color:'#BFDBFE', fontSize:16, fontWeight:'bold'}}>{selectedStock?.market==='US'?'$':'₩'}{selectedStock && Math.floor(selectedStock.buyZoneBottom*0.97).toLocaleString()}</Text>
                   </View>
                </View>
             </View>

             {/* 차트 */}
             <View style={styles.card}>
                <Text style={styles.sectionTitle}>주가 흐름 (최근 10일)</Text>
                {selectedStock?.history && selectedStock.history.length > 0 ? (
                  <LineChart
                    data={{
                      labels: selectedStock.history.map(h => h.time.split('-')[1]).slice(-7),
                      datasets: [{ data: selectedStock.history.map(h => h.price).slice(-7) }]
                    }}
                    width={Dimensions.get("window").width - 64}
                    height={180}
                    yAxisLabel={selectedStock.market === 'US' ? '$' : ''}
                    chartConfig={{
                      backgroundColor: "#1F2937",
                      backgroundGradientFrom: "#1F2937",
                      backgroundGradientTo: "#1F2937",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                      propsForDots: { r: "3", strokeWidth: "1", stroke: "#60A5FA" }
                    }}
                    bezier
                    style={{ marginVertical: 8, borderRadius: 16 }}
                  />
                ) : <Text style={styles.emptyText}>차트 데이터 없음</Text>}
             </View>

             {/* 뉴스 */}
             <View style={styles.card}>
                <Text style={styles.sectionTitle}>주요 뉴스</Text>
                {selectedStock?.news && selectedStock.news.length > 0 ? (
                  selectedStock.news.map((n, i) => (
                    <TouchableOpacity key={i} onPress={() => Linking.openURL(n.link)} style={{marginBottom: 12}}>
                       <Text style={{color:'white', fontSize:13, fontWeight:'bold', marginBottom:4}}>{n.title}</Text>
                       <View style={styles.row}>
                          {n.sentiment === 'positive' && <Text style={{color:'#EF4444', fontSize:10, marginRight:6}}>호재</Text>}
                          <Text style={{color:'#6B7280', fontSize:10}}>{n.publisher}</Text>
                       </View>
                    </TouchableOpacity>
                  ))
                ) : <Text style={styles.emptyText}>뉴스 없음</Text>}
             </View>
             <View style={{height: 40}} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  modalContainer: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#374151', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  logoText: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  iconBtn: { padding: 8, backgroundColor: '#1F2937', borderRadius: 20 },
  
  scrollView: { flex: 1 },
  bannerScroll: { marginHorizontal: 16, marginTop: 10, marginBottom: 16, maxHeight: 60 },
  marketBadge: { backgroundColor: '#1F2937', padding: 8, borderRadius: 12, marginRight: 8, minWidth: 85, borderWidth: 1, borderColor: '#374151' },
  panicBadge: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' },
  marketTitle: { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold' },
  marketValue: { color: 'white', fontSize: 14, fontWeight: 'bold', marginRight: 4 },
  marketChange: { fontSize: 10, fontWeight: 'bold' },
  marketMsg: { color: '#D1D5DB', fontSize: 10, marginTop: 2 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#1F2937', marginHorizontal: 16, padding: 4, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  activeTabBtn: { backgroundColor: '#374151' },
  tabText: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  activeTabText: { color: 'white' },
  
  stockCard: { backgroundColor: '#1F2937', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#374151', overflow: 'hidden' },
  rankBadge: { position: 'absolute', top: 0, left: 0, backgroundColor: '#2563EB', paddingHorizontal: 8, paddingVertical: 4, borderBottomRightRadius: 10 },
  rankText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  volBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 4, borderBottomLeftRadius: 10, flexDirection: 'row', alignItems: 'center' },
  volText: { color: 'white', fontSize: 10, fontWeight: 'bold', marginLeft: 2 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 },
  symbolText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginRight: 6 },
  sectorText: { color: '#9CA3AF', fontSize: 10, backgroundColor: '#374151', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  priceText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  
  reasonBox: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  reasonText: { color: '#60A5FA', fontSize: 11, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  
  barContainer: { height: 4, backgroundColor: '#374151', borderRadius: 2, marginTop: 12, position: 'relative' },
  barFill: { position: 'absolute', left: 0, right: 0, height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.3)' },
  barDot: { position: 'absolute', left: '50%', top: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  
  emptyView: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#6B7280', fontSize: 14, marginTop: 10 },
  
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#374151', backgroundColor: '#111827' },
  navBtn: { padding: 10 },
  
  splashIcon: { backgroundColor: '#4F46E5', padding: 20, borderRadius: 30, marginBottom: 20 },
  splashTitle: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  splashSub: { fontSize: 14, color: '#9CA3AF', marginTop: 10 },

  // 모달 스타일
  modalHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1F2937' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  modalSub: { fontSize: 12, color: '#9CA3AF' },
  content: { padding: 16 },
  card: { backgroundColor: '#1F2937', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  sectionTitle: { color: '#E5E7EB', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  scoreBox: { backgroundColor: 'rgba(99, 102, 241, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#6366F1' },
  scoreText: { color: '#A5B4FC', fontSize: 10, fontWeight: 'bold' },
  grid: { flexDirection: 'row', gap: 10 },
  gridItem: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});
