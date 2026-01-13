import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Platform, BackHandler, Alert, Dimensions, Share, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { TestIds, useInterstitialAd } from 'react-native-google-mobile-ads';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { onAuthStateChanged, signOut, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { BarChart } from 'react-native-chart-kit'; 

// 👇 [경로 유지] src 폴더 참조
import { auth, db } from '../src/firebaseConfig';
import { styles } from '../src/styles';
import { Icon } from '../src/components/Icons';
import { GuideModal, CustomAlert, AdBannerComponent } from '../src/components/Common';
import { MarketBanner, StockCard } from '../src/components/StockComponents'; 
import { LoginScreen, NotificationView, HistoryView as HistoryListView, SettingsView } from '../src/screens/SubScreens';

WebBrowser.maybeCompleteAuthSession();

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DATA_URL = "https://ajazara-ops.github.io/dailypick10/todays_recommendation.json";
const REVENUECAT_API_KEY = "goog_MKfuRHbmvkzalvwQiaDDxplmIff";

// [광고 ID 설정]
const adUnitIdBanner = __DEV__ ? TestIds.BANNER : 'ca-app-pub-7936612612148990/7265446537';
const adUnitIdInterstitial = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-7936612612148990/2783082527';

const FALLBACK_DATA = [
  { id: 'us1', rank: 1, symbol: 'PLTR', name: 'Palantir', market: 'US', currentPrice: 22.5, changePercent: 1.2, buyZoneTop: 23, buyZoneBottom: 21, targetPrice: 28, aiReason: 'RSI 과매도 + 골든크로스 + 매출 고성장', history: [], score: 85, rsi: 32, news: [], rvol: 2.5, sector: "Technology", financials: { op_margin: 0.2, rev_growth: 0.15, per: 45 } },
  { id: 'kr1', rank: 1, symbol: '005930', name: '삼성전자', market: 'KR', currentPrice: 72500, changePercent: -0.5, buyZoneTop: 73000, buyZoneBottom: 71000, targetPrice: 80000, aiReason: '외국인 수급 유입 + 60일선 지지', history: [], score: 75, rsi: 45, news: [], rvol: 1.2, sector: "Technology", financials: { op_margin: 0.1, rev_growth: -0.05, per: 12 } }
];

// --- [푸시 토큰 발급 함수] ---
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('알림 권한을 허용해주세요!');
      return;
    }
    
    try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.manifest?.extra?.eas?.projectId ?? '6f0c06d8-1576-4cd5-baaf-6d4bbcb84b0a';
        token = (await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
        })).data;
        console.log("🔥 나의 푸시 토큰:", token);
    } catch (e) {
        console.error("토큰 발급 실패:", e);
    }
  }
  return token;
}

// ---------------- StockDetail Component ----------------
const StockDetail = ({ stock, onBack, isFavorite, onToggleFavorite }) => {
    if (!stock) return null;
    const detailedReasons = stock.aiReason ? stock.aiReason.split('+').map(r => r.trim()) : [];
    const stopLossPrice = Math.floor(stock.buyZoneBottom * 0.97);
    const takeProfitPrice1 = Math.floor(stock.currentPrice * 1.05);
    const takeProfitPrice2 = Math.floor(stock.currentPrice * 1.10);
    const recommendationStatus = stock.rank
        ? <View style={{backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#2563EB'}}><Text style={{fontSize: 10, color: '#93C5FD', fontWeight: 'bold'}}>🔥 AI 추천중 (TOP {stock.rank})</Text></View>
        : <View style={{backgroundColor: '#374151', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#4B5563'}}><Text style={{fontSize: 10, color: '#D1D5DB', fontWeight: 'bold'}}>⚠️ 과거 기록</Text></View>;

    const techKeywords = ['RSI', '과매도', '이평선', '지지', 'MACD', '골든크로스', '눌림목', '볼린저밴드', '거래량', '스토캐스틱', '추세'];
    const fundKeywords = ['매출', '이익', '성장', 'PER', '재무', '건전성', '흑자', 'PBR', '저평가'];
    
    const techReasons = detailedReasons.filter(r => techKeywords.some(k => r.includes(k)));
    const fundReasons = detailedReasons.filter(r => fundKeywords.some(k => r.includes(k)));
    const otherReasons = detailedReasons.filter(r => !techKeywords.some(k => r.includes(k)) && !fundKeywords.some(k => r.includes(k)));

    const RSIBar = ({ value }) => {
        const safeValue = Math.max(0, Math.min(100, value || 50));
        return (
            <View style={{marginTop: 8}}>
                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 4}}>
                    <Text style={{color:'#D1D5DB', fontSize:12}}>RSI 지수</Text>
                    <Text style={{color:'#D1D5DB', fontSize:12, fontWeight:'bold'}}>{safeValue}</Text>
                </View>
                <View style={{height: 6, backgroundColor:'#374151', borderRadius:3, overflow:'hidden', position:'relative'}}>
                    <View style={{position:'absolute', left:0, width:'30%', height:'100%', backgroundColor:'rgba(16,185,129,0.3)'}} />
                    <View style={{position:'absolute', right:0, width:'30%', height:'100%', backgroundColor:'rgba(239,68,68,0.3)'}} />
                    <View style={{position:'absolute', left: `${safeValue}%`, top:-2, width:4, height:10, backgroundColor:'white', borderRadius:2}} />
                </View>
                <View style={{flexDirection:'row', justifyContent:'space-between', marginTop: 2}}>
                    <Text style={{color:'#10B981', fontSize:10}}>과매도</Text>
                    <Text style={{color:'#EF4444', fontSize:10}}>과매수</Text>
                </View>
            </View>
        );
    };

    const AiReasonSection = ({ title, icon, color, reasons, showRsi = false }) => (
        <View style={{marginTop: 15}}>
            <View style={styles.row}>
                <Icon name={icon} size={16} color={color} />
                <Text style={[styles.cardTitle, {marginBottom: 0, marginLeft: 8}]}>{title}</Text>
            </View>
            <View style={styles.reasonSectionBox}>
                {showRsi && <RSIBar value={stock.rsi} />}
                {reasons.map((r, i) => (
                    <View key={i} style={styles.reasonItem}>
                        <View style={[styles.reasonBullet, {backgroundColor: color}]} />
                        <Text style={styles.reasonTextNew}>{r}</Text>
                    </View>
                ))}
                {reasons.length === 0 && !showRsi && <Text style={styles.infoTextSmall}>해당 사항 없음</Text>}
            </View>
        </View>
    );

    return (
        <Modal visible={true} animationType="slide" onRequestClose={onBack}>
            <RNSafeAreaView style={{flex: 1, backgroundColor: '#111827'}} edges={['top', 'bottom', 'left', 'right']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                      <Icon name="arrowLeft" color="#E5E7EB" />
                    </TouchableOpacity>
                    <View style={{alignItems: 'flex-start'}}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={styles.headerTitle}>{stock.symbol}</Text>
                            <View style={{marginLeft: 8}}>{recommendationStatus}</View>
                        </View>
                        <Text style={styles.headerSubtitle}>{stock.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => onToggleFavorite(stock)} style={styles.iconBtn}>
                      <Icon name={isFavorite ? "starFilled" : "star"} color={isFavorite ? "#FBBF24" : "#9CA3AF"} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.cardTitle}>스윙 매매 전략</Text>
                            {stock.score && <View style={styles.scoreBadge}><Text style={styles.scoreText}>AI {stock.score}점</Text></View>}
                        </View>
                        <View style={styles.grid2}>
                            <View style={[styles.miniCard, {backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)'}]}>
                                <Text style={[styles.label, {color:'#EF4444'}]}>🎯 1차 익절 (+5%)</Text>
                                <Text style={[styles.value, {color:'#FECACA'}]}>{stock.market==='US'?'$':'₩'}{takeProfitPrice1.toLocaleString()}</Text>
                            </View>
                            <View style={[styles.miniCard, {backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)'}]}>
                                <Text style={[styles.label, {color:'#EF4444'}]}>🚀 2차 익절 (+10%)</Text>
                                <Text style={[styles.value, {color:'#FECACA'}]}>{stock.market==='US'?'$':'₩'}{takeProfitPrice2.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View style={[styles.miniCard, {marginTop: 10, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)', flexDirection:'row', justifyContent:'space-between', paddingHorizontal: 16}]}>
                            <Text style={[styles.label, {color:'#3B82F6', marginBottom:0}]}>🛡️ 손절가 (-3%)</Text>
                            <Text style={[styles.value, {color:'#BFDBFE'}]}>{stock.market==='US'?'$':'₩'}{stopLossPrice.toLocaleString()}</Text>
                        </View>
                        <View style={styles.priceInfoBar}>
                            <Text style={styles.infoTextSmall}>현재가: <Text style={{color:'white', fontWeight:'bold'}}>{stock.currentPrice.toLocaleString()}</Text></Text>
                            <Text style={styles.infoTextSmall}>|</Text>
                            <Text style={styles.infoTextSmall}>매수구간: {stock.buyZoneBottom.toLocaleString()} ~ {stock.buyZoneTop.toLocaleString()}</Text>
                        </View>
                    </View>

                    {stock.financials && (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>핵심 재무 지표</Text>
                            <View style={styles.grid3}>
                                <View style={[styles.financeBox, {backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)'}]}>
                                    <Text style={[styles.financeLabel, {color: '#C4B5FD'}]}>영업이익률</Text>
                                    <Text style={styles.financeValue}>
                                        {stock.financials.op_margin != null ? (stock.financials.op_margin * 100).toFixed(1) + '%' : '-'}
                                    </Text>
                                </View>
                                <View style={[styles.financeBox, {backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)'}]}>
                                    <Text style={[styles.financeLabel, {color: '#93C5FD'}]}>매출성장</Text>
                                    <Text style={styles.financeValue}>
                                        {stock.financials.rev_growth != null ? (stock.financials.rev_growth * 100).toFixed(1) + '%' : '-'}
                                    </Text>
                                </View>
                                <View style={[styles.financeBox, {backgroundColor: 'rgba(75, 85, 99, 0.3)', borderColor: 'rgba(75, 85, 99, 0.5)'}]}>
                                    <Text style={[styles.financeLabel, {color: '#9CA3AF'}]}>PER</Text>
                                    <Text style={styles.financeValue}>
                                        {stock.financials.per != null && stock.financials.per > 0 ? stock.financials.per.toFixed(1) + '배' : '-'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>AI 추천 근거</Text>
                        {fundReasons.length > 0 && <AiReasonSection title="재무 건전성 (Fundamental)" icon="pie" color="#818CF8" reasons={fundReasons} />}
                        <AiReasonSection title="기술적 분석" icon="activity" color="#60A5FA" reasons={techReasons} showRsi={true} />
                        {otherReasons.length > 0 && <AiReasonSection title="기타 분석" icon="shield" color="#9CA3AF" reasons={otherReasons} />}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>관련 주요 뉴스</Text>
                        {stock.news && stock.news.length > 0 ? (
                            stock.news.slice(0, 3).map((n, i) => (
                                <TouchableOpacity key={i} onPress={() => WebBrowser.openBrowserAsync(n.link)} style={styles.newsItem}>
                                    <Text style={styles.newsTitle}>{n.title}</Text>
                                    <View style={styles.row}>
                                        {n.sentiment === 'positive' && <Text style={{color:'#EF4444', fontSize:10, marginRight:6, fontWeight:'bold'}}>호재</Text>}
                                        {n.sentiment === 'negative' && <Text style={{color:'#3B82F6', fontSize:10, marginRight:6, fontWeight:'bold'}}>악재</Text>}
                                        <Text style={styles.newsDate}>{n.publisher}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : <Text style={styles.infoText}>뉴스 없음</Text>}
                    </View>
                    <View style={{height: 30}} />
                </ScrollView>

                <View style={styles.bottomSheet}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => onToggleFavorite(stock)}>
                        <Text style={styles.actionBtnText}>{isFavorite ? "관심종목 해제" : "관심종목 담기"}</Text>
                    </TouchableOpacity>
                </View>
            </RNSafeAreaView>
        </Modal>
    );
};

// ---------------- HistoryReport Component ----------------
const HistoryReport = ({ stocks, date }) => {
    const [reportTab, setReportTab] = useState('US');

    const displayDate = date ? date.split(' ')[0] : "";

    const currentStocks = useMemo(() => {
        if (!stocks) return [];
        return stocks.filter(s => s.market === reportTab);
    }, [stocks, reportTab]);

    const reportData = useMemo(() => {
        if (currentStocks.length === 0) return { items: [], avgReturn: "0.00" };

        const calculatedItems = currentStocks.map(stock => {
            const realReturn = stock.returnRate !== undefined ? stock.returnRate : 0.0;
            return {
                ...stock,
                returnRate: parseFloat(realReturn) || 0.0
            };
        });

        const top10Items = calculatedItems.sort((a, b) => b.returnRate - a.returnRate).slice(0, 10);

        let avgReturn = "0.00";
        if (top10Items.length > 0) {
            const totalTop10Return = top10Items.reduce((acc, item) => acc + item.returnRate, 0);
            avgReturn = (totalTop10Return / top10Items.length).toFixed(2);
        }
        
        return { items: top10Items, avgReturn: avgReturn };
    }, [currentStocks]);

    const chartConfig = {
      backgroundGradientFrom: "#1F2937",
      backgroundGradientTo: "#1F2937",
      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      strokeWidth: 2,
      barPercentage: 0.5,
    };

    return (
        <View style={{padding: 16}}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
                 <View style={{backgroundColor:'rgba(79, 70, 229, 0.2)', padding:8, borderRadius:8, marginRight:10}}>
                     <Icon name="calendar" size={20} color="#818CF8" />
                 </View>
                 <Text style={{color:'white', fontWeight:'bold', fontSize: 18}}>{displayDate} 리포트</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity onPress={() => setReportTab('US')} style={[styles.tabBtn, reportTab==='US' && styles.activeTabBtn]}>
                    <Icon name="globe" size={14} color={reportTab==='US'?'#fff':'#9CA3AF'} />
                    <Text style={[styles.tabText, reportTab==='US' && styles.activeTabText]}>미국</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setReportTab('KR')} style={[styles.tabBtn, reportTab==='KR' && styles.activeTabBtn]}>
                    <Icon name="chart" size={14} color={reportTab==='KR'?'#fff':'#9CA3AF'} />
                    <Text style={[styles.tabText, reportTab==='KR' && styles.activeTabText]}>한국</Text>
                </TouchableOpacity>
            </View>

            {currentStocks.length === 0 ? (
                <View style={{alignItems: 'center', marginTop: 40}}>
                    <Icon name="alert" size={40} color="#374151" />
                    <Text style={styles.infoText}>해당 날짜 데이터가 없습니다.</Text>
                </View>
            ) : (
                <>
                    <View style={{backgroundColor: '#1F2937', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20, borderColor: '#374151', borderWidth: 1}}>
                        <Text style={{color: '#9CA3AF', fontSize: 14}}>
                            {reportTab === 'US' ? '미국 Top 10 평균 수익률' : '한국 Top 10 평균 수익률'}
                        </Text>
                        <Text style={{color: parseFloat(reportData.avgReturn) >= 0 ? '#EF4444' : '#3B82F6', fontSize: 36, fontWeight: 'bold', marginTop: 8}}>
                            {parseFloat(reportData.avgReturn) > 0 ? '+' : ''}{reportData.avgReturn}%
                        </Text>
                        <Text style={{color: '#6B7280', fontSize: 12, marginTop: 4}}>(2주 보유 시뮬레이션)</Text>
                    </View>

                    <View style={{marginBottom: 24}}>
                        <Text style={{color: '#E5E7EB', fontSize: 16, fontWeight: 'bold', marginBottom: 12}}>수익률 Top 5</Text>
                        <BarChart
                            data={{
                                labels: reportData.items.slice(0, 5).map(i => i.symbol),
                                datasets: [{ data: reportData.items.slice(0, 5).map(i => i.returnRate) }]
                            }}
                            width={Dimensions.get("window").width - 32}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix="%"
                            chartConfig={chartConfig}
                            verticalLabelRotation={0}
                            fromZero={true}
                            style={{ borderRadius: 16 }}
                        />
                    </View>

                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 12}}>
                        <Text style={{color: '#E5E7EB', fontSize: 16, fontWeight: 'bold'}}>상위 10개 종목</Text>
                        <Text style={{color: '#6B7280', fontSize: 12}}>수익률 순</Text>
                    </View>

                    <View style={{backgroundColor: '#1F2937', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#374151'}}>
                        {reportData.items.map((stock, idx) => (
                            <View key={`${stock.id}-${idx}`} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: idx === reportData.items.length - 1 ? 0 : 1, borderBottomColor: '#374151'}}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <View style={{width: 24, height: 24, borderRadius: 12, backgroundColor: idx < 3 ? '#FBBF24' : '#374151', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#4B5563'}}>
                                        <Text style={{color: idx < 3 ? '#111827' : '#9CA3AF', fontSize: 11, fontWeight: 'bold'}}>{idx + 1}</Text>
                                    </View>
                                    <View>
                                        <View style={{flexDirection:'row', alignItems:'center'}}>
                                            <Text style={{color: 'white', fontWeight: 'bold', fontSize: 15, marginRight:6}}>{stock.symbol}</Text>
                                            <View style={{backgroundColor:'#374151', paddingHorizontal:4, paddingVertical:1, borderRadius:3}}>
                                                <Text style={{color:'#9CA3AF', fontSize:9}}>{stock.market}</Text>
                                            </View>
                                        </View>
                                        <Text style={{color: '#9CA3AF', fontSize: 11}}>{stock.name}</Text>
                                    </View>
                                </View>
                                <Text style={{color: stock.returnRate >= 0 ? '#EF4444' : '#3B82F6', fontWeight: 'bold', fontSize: 15}}>
                                    {stock.returnRate > 0 ? '+' : ''}{stock.returnRate}%
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View style={{marginTop: 24, padding: 12, borderRadius: 8, backgroundColor: 'rgba(55, 65, 81, 0.3)', borderWidth: 1, borderColor: 'rgba(75, 85, 99, 0.3)', borderStyle: 'dashed'}}>
                        <Text style={{color: '#6B7280', fontSize: 11, textAlign: 'center', lineHeight: 16}}>
                            ※ 위 성과는 과거 데이터를 기반으로 한 AI 시뮬레이션 결과이며, 미래의 수익을 보장하지 않습니다. 모든 투자의 책임은 본인에게 있습니다.
                        </Text>
                    </View>
                </>
            )}
            <View style={{height: 50}} />
        </View>
    );
};

// ---------------- HistoryView (목록) ----------------
const HistoryView = ({ onSelectHistory }) => {
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchHistoryIndex = async () => {
            setLoading(true);
            try {
                // [수정] DATA_URL에서 도메인을 추출하여 history_index.json 경로 생성
                const baseUrl = DATA_URL.substring(0, DATA_URL.lastIndexOf('/'));
                const indexUrl = `${baseUrl}/history_index.json`;
                
                const res = await fetch(indexUrl, { cache: "no-store" });

                if (res.ok) {
                    const data = await res.json();
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

                    const filteredData = data.filter(item => {
                        const itemDate = new Date(item.date);
                        return itemDate >= threeMonthsAgo;
                    });
                    const sortedData = filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
                    setHistoryList(sortedData);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchHistoryIndex();
    }, []);

    return (
        <View style={{flex: 1, backgroundColor: '#111827'}}>
            <ScrollView style={styles.content}>
                {loading && <ActivityIndicator style={{marginTop: 50}} size="large" color="#818CF8" />}

                {!loading && historyList.length === 0 && (
                    <View style={styles.centerView}>
                        <Icon name="history" size={40} color="#374151" />
                        <Text style={styles.infoText}>최근 리포트가 없습니다.</Text>
                    </View>
                )}

                {historyList.map((item, idx) => {
                    const dateParts = item.date.split('-');
                    const month = parseInt(dateParts[1], 10);
                    const day = parseInt(dateParts[2], 10);
                    
                    const dateLabelBig = `${month}월 ${day}일`;
                    const dateLabelSmall = item.date;

                    return (
                        <TouchableOpacity key={idx} onPress={() => onSelectHistory(item.file)} style={styles.stockCard}>
                            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                                <View style={{flex: 1}}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
                                        <View style={{backgroundColor:'rgba(79, 70, 229, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 12}}>
                                            <Text style={{color: '#818CF8', fontWeight: 'bold', fontSize: 16}}>{dateLabelBig}</Text>
                                        </View>
                                        <View>
                                            <Text style={{color:'white', fontWeight:'bold', fontSize: 15}}>성과 리포트</Text>
                                            <Text style={{color:'#9CA3AF', fontSize: 11, marginTop: 4}}>{dateLabelSmall} 기준</Text>
                                        </View>
                                    </View>
                                    <View style={{flexDirection:'row', alignItems:'center', paddingLeft: 42}}>
                                        <Text style={{color:'#9CA3AF', fontSize:11, marginRight: 8}}>터치하여 상세 보기</Text>
                                    </View>
                                </View>
                                <Icon name="arrowRight" size={16} color="#6B7280" />
                            </View>
                        </TouchableOpacity>
                    );
                })}
                <View style={{height: 50}} />
            </ScrollView>
        </View>
    );
};

export default function App() {
  const [stocks, setStocks] = useState([]);
  const [marketStatus, setMarketStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('US');
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeView, setActiveView] = useState('HOME');
  const [showSplash, setShowSplash] = useState(true);

  const [userInfo, setUserInfo] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState(''); 

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [isHistoryMode, setIsHistoryMode] = useState(false);
  const [historyDate, setHistoryDate] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const [isPremium, setIsPremium] = useState(false);
  const [pendingStock, setPendingStock] = useState(null);
  // [New] 대기 중인 히스토리 파일 (광고 후 열람용)
  const [pendingHistory, setPendingHistory] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [hasShownInitialAd, setHasShownInitialAd] = useState(false);
  const [unlockedStocks, setUnlockedStocks] = useState([]);

  const [alertConfig, setAlertConfig] = useState({
      visible: false, title: "", message: "", onConfirm: () => {}, confirmText: "확인", showCancel: false, onCancel: () => {},
  });

  const { isLoaded, isClosed, load, show } = useInterstitialAd(adUnitIdInterstitial, {
      requestNonPersonalizedAdsOnly: true,
  });

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
        if (token) {
            setExpoPushToken(token);
        }
    });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        const { title, body } = notification.request.content;
        console.log("🔔 [알림 수신됨] 제목:", title, "내용:", body); 
        addNotification(title, body);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        const { title, body } = response.notification.request.content;
        console.log("👆 [알림 클릭됨] 제목:", title, "내용:", body); 
        addNotification(title, body);
        setActiveView('NOTIFICATIONS');
    });

    return () => {
        notificationListener.remove();
        responseListener.remove();
    };
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (alertConfig.visible) {
        if (alertConfig.onCancel) {
            alertConfig.onCancel();
        } else {
            setAlertConfig(prev => ({ ...prev, visible: false }));
        }
        return true;
      }
      
      if (selectedStock) { setSelectedStock(null); return true; }
      if (showGuide) { setShowGuide(false); return true; }

      if (isHistoryMode) {
        setIsHistoryMode(false);
        setActiveView('HISTORY'); 
        setHistoryDate(null);
        return true;
      }
      
      if (activeView !== 'HOME') {
        setActiveView('HOME');
        if (isHistoryMode) { 
            setIsHistoryMode(false); 
            setHistoryDate(null); 
            fetchStockData(DATA_URL); 
        }
        return true;
      }
      
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedStock, activeView, showGuide, isHistoryMode, alertConfig.visible]); 

  useEffect(() => {
    const initRevenueCat = async () => {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      if (Platform.OS === 'android') Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null) setOfferings(offerings.current);
        const customerInfo = await Purchases.getCustomerInfo();
        if (customerInfo.entitlements.active['premium']) setIsPremium(true);
      } catch (e) { console.log("RevenueCat Init Error:", e); }
    };
    initRevenueCat();
  }, []);

  useEffect(() => { try { load(); } catch (e) { console.log("Ad load error:", e); } }, [load, isClosed]);

  useEffect(() => {
    if (!showSplash && userInfo && !isPremium && !hasShownInitialAd && isLoaded) {
        try { show(); setHasShownInitialAd(true); } catch (e) { console.log("Ad show error:", e); }
    }
  }, [showSplash, userInfo, isPremium, hasShownInitialAd, isLoaded]);

  // [수정] 광고가 닫혔을 때 처리 (종목 또는 히스토리 열람)
  useEffect(() => {
      if (isClosed) {
          // 1. 잠긴 종목 해제
          if (pendingStock) {
              setUnlockedStocks(prev => [...prev, pendingStock.id]);
              setSelectedStock(pendingStock);
              setPendingStock(null);
          }
          // 2. [New] 성과 리포트 열기
          if (pendingHistory) {
              handleLoadHistory(pendingHistory);
              setPendingHistory(null);
          }
      }
  }, [isClosed, pendingStock, pendingHistory]);

  const addNotification = async (title, message) => {
    const saved = await AsyncStorage.getItem('myNotifications');
    let currentList = saved ? JSON.parse(saved) : [];

    const newNoti = { 
        id: Date.now(), 
        title: title || "알림", 
        message: message || "", 
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) 
    };
    
    // [수정] 중복 방지 (같은 메시지가 최근에 있으면 무시)
    const isDuplicate = currentList.length > 0 && currentList[0].title === newNoti.title && currentList[0].message === newNoti.message;
    
    if (!isDuplicate) {
        const updatedList = [newNoti, ...currentList];
        await AsyncStorage.setItem('myNotifications', JSON.stringify(updatedList));
        setNotifications(updatedList);
        
        setToastMessage(title || "알림"); 
        setShowToast(true); 
        setTimeout(() => setShowToast(false), 3000);
    }
  };

  // [수정됨] 초기화 및 데이터 로딩 로직 분리
  useEffect(() => {
    setTimeout(() => setShowSplash(false), 2000);
    let unsubscribeAuth;
    if (auth) {
        unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserInfo(user);
                try {
                  const docRef = doc(db, "users", user.uid);
                  const docSnap = await getDoc(docRef);
                  if (docSnap.exists()) {
                      const data = docSnap.data();
                      setFavorites(data.favorites || []);
                      if (data.isPremium) setIsPremium(true);
                  }
                } catch (e) { console.warn("Load Data Error", e); }
            } else {
                setUserInfo(null); setFavorites([]); setIsPremium(false);
            }
        });
    } else {
        AsyncStorage.getItem('userInfo').then(user => { if(user) setUserInfo(JSON.parse(user)); });
        AsyncStorage.getItem('myFavorites').then(favs => { if(favs) setFavorites(JSON.parse(favs)); });
    }

    const init = async () => {
      try {
        const savedNotis = await AsyncStorage.getItem('myNotifications');
        if (savedNotis) {
            const parsedNotis = JSON.parse(savedNotis);
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            const validNotis = parsedNotis.filter(n => n.id > oneWeekAgo);

            if (validNotis.length !== parsedNotis.length) {
                await AsyncStorage.setItem('myNotifications', JSON.stringify(validNotis));
            }
            setNotifications(validNotis);
        }
        
        const savedLastUpdated = await AsyncStorage.getItem('lastUpdatedTime');
        if (savedLastUpdated) setLastUpdated(savedLastUpdated);
        
      } catch (e) { console.warn(e); }
    };
    init();
    return () => { if(unsubscribeAuth) unsubscribeAuth(); };
  }, []);

  // 2. [신규] 주기적 데이터 갱신 로직 (isHistoryMode가 아닐 때만 작동)
  useEffect(() => {
    if (isHistoryMode) {
        return; // 히스토리 모드일 때는 자동 갱신 중단
    }

    fetchStockData(DATA_URL); 
    const interval = setInterval(() => {
        fetchStockData(DATA_URL);
    }, 30000);

    return () => clearInterval(interval);
  }, [isHistoryMode]); 

  const showAlert = (title, message, onConfirm = () => {}, showCancel = false, onCancel = () => {}, confirmText = "확인") => {
      setAlertConfig({ visible: true, title, message, onConfirm: () => { setAlertConfig(prev => ({ ...prev, visible: false })); onConfirm(); }, showCancel, onCancel: () => { setAlertConfig(prev => ({ ...prev, visible: false })); onCancel(); }, confirmText });
  };

  const handleLogout = async () => {
      showAlert("로그아웃", "정말 로그아웃 하시겠습니까?", async () => {
              if (auth) await signOut(auth);
              else { await AsyncStorage.removeItem('userInfo'); setUserInfo(null); }
          }, true
      );
  };

  const handleDeleteAccount = async () => {
      showAlert("회원 탈퇴", "정말로 탈퇴하시겠습니까? 계정과 모든 데이터가 삭제됩니다.", async () => {
              if (auth && auth.currentUser) {
                  try {
                      await deleteDoc(doc(db, "users", auth.currentUser.uid));
                      await deleteUser(auth.currentUser);
                      showAlert("탈퇴 완료", "이용해 주셔서 감사합니다.");
                  } catch (e) { showAlert("오류", "탈퇴 처리 중 문제가 발생했습니다. 다시 로그인 후 시도해주세요."); }
              }
          }, true
      );
  };

  const handlePasswordReset = async () => {
      if (userInfo && userInfo.email) {
          try { await sendPasswordResetEmail(auth, userInfo.email); showAlert("이메일 발송", `${userInfo.email}로 비밀번호 재설정 링크를 보냈습니다.`); } 
          catch (e) { showAlert("오류", e.message); }
      }
  };

  const toggleFavorite = async (stock) => {
    let newFavs;
    const exists = favorites.some(fav => fav.id === stock.id);
    if (auth && userInfo) {
        const userDocRef = doc(db, "users", userInfo.uid);
        if (exists) {
          newFavs = favorites.filter(fav => fav.id !== stock.id);
          await updateDoc(userDocRef, { favorites: arrayRemove(stock) });
        } else {
          newFavs = [...favorites, stock];
          await setDoc(userDocRef, { favorites: arrayUnion(stock) }, { merge: true });
        }
        setFavorites(newFavs);
    } else {
        if (exists) newFavs = favorites.filter(fav => fav.id !== stock.id);
        else newFavs = [...favorites, stock];
        setFavorites(newFavs);
        await AsyncStorage.setItem('myFavorites', JSON.stringify(newFavs));
    }
  };

  const clearNotifications = async () => { setNotifications([]); await AsyncStorage.removeItem('myNotifications'); };

  const fetchStockData = async (url = DATA_URL) => {
    setError(false);
    try {
      const response = await fetch(`${url}?t=${Date.now()}`);
      if (!response.ok) throw new Error("Data Error");
      const data = await response.json();
      if (data.stocks) {
        setStocks(data.stocks); setMarketStatus(data.market_status); setError(false);
      } else {
        if (Array.isArray(data)) setStocks(data); else throw new Error("Format Error");
      }
      const currentLastUpdated = await AsyncStorage.getItem('lastUpdatedTime');
      if (url === DATA_URL && data.timestamp && data.timestamp !== currentLastUpdated) {
          const dataTime = new Date(data.timestamp.replace(/-/g, '/'));
          const now = new Date();
          if (dataTime.toDateString() === now.toDateString()) { 
              const notiTitle = data.notification?.title || "🔔 새로운 추천 도착!";
              const notiBody = data.notification?.body || "AI가 새로운 종목 분석을 완료했습니다.";
              // [수정] 알림 추가 로직
              addNotification(notiTitle, notiBody);
          }
          setLastUpdated(data.timestamp); await AsyncStorage.setItem('lastUpdatedTime', data.timestamp);
      }
    } catch (err) {
      console.log("Load Failed, using fallback"); setError(true);
      if(stocks.length === 0) setStocks(FALLBACK_DATA);
    }
  };

  const handleLoadHistory = async (fileUrl) => {
    setLoading(true);
    try {
        // [수정] 파일 경로가 상대 경로(history/...)로 들어올 경우, 전체 URL로 변환
        let fullUrl = fileUrl;
        if (!fileUrl.startsWith('http')) {
            const baseUrl = DATA_URL.substring(0, DATA_URL.lastIndexOf('/'));
            fullUrl = `${baseUrl}/${fileUrl}`;
        }

        const response = await fetch(fullUrl, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch history");
        const data = await response.json();
        
        if (data.stocks) {
            setStocks(data.stocks); 
            setMarketStatus(data.market_status); 
            setIsHistoryMode(true);
            
            // 날짜 추출 로직 보강
            let displayDate = '과거';
            if (data.timestamp) {
                displayDate = data.timestamp;
            } else {
                const dateMatch = fileUrl.match(/(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) displayDate = dateMatch[0];
            }
            setHistoryDate(displayDate);
            setActiveView('HOME'); 
        }
    } catch (e) { 
        showAlert("오류", "데이터를 불러올 수 없습니다.\n" + e.message); 
    } finally { 
        setLoading(false); 
    }
  };

  // [New] 리포트 클릭 핸들러 (권한 및 광고 체크)
  const handleHistoryClick = (fileUrl) => {
      if (isPremium) {
          // 프리미엄 회원은 바로 열람
          handleLoadHistory(fileUrl);
      } else {
          // 무료 회원은 광고 시청 유도
          if (isLoaded) {
              setPendingHistory(fileUrl);
              show();
          } else {
              // 광고가 로드되지 않았을 경우 잠시 대기 안내 후 재로드 시도
              showAlert("알림", "광고를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
              load();
          }
      }
  };

  const handleRefresh = () => { setIsHistoryMode(false); setHistoryDate(null); fetchStockData(DATA_URL); };
  const handleGoHome = () => { setIsHistoryMode(false); setHistoryDate(null); fetchStockData(DATA_URL); setActiveTab('US'); setActiveView('HOME'); };
  const handleBackToHistoryList = () => { setIsHistoryMode(false); setActiveView('HISTORY'); setHistoryDate(null); };

  const displayStocks = useMemo(() => {
    if (activeView === 'HISTORY') return [];
    if (activeTab === 'FAV') {
      return favorites.map(fav => { const latest = stocks.find(s => s.id === fav.id); return latest ? { ...latest, rank: latest.rank } : { ...fav, rank: null }; });
    }
    return stocks.filter(stock => stock.market === activeTab);
  }, [activeTab, stocks, activeView, favorites]);

  const handlePurchasePremium = async (planType) => {
      if (!offerings) { showAlert("오류", "상품 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요."); return; }
      try {
          let packageToBuy;
          if (planType === 'monthly') packageToBuy = offerings.monthly;
          else if (planType === 'yearly') packageToBuy = offerings.annual;
          if (!packageToBuy) { showAlert("오류", "해당 상품 패키지를 찾을 수 없습니다."); return; }
          const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
          if (customerInfo.entitlements.active['premium']) {
              setIsPremium(true); if (userInfo) updateDoc(doc(db, "users", userInfo.uid), { isPremium: true });
              showAlert("결제 성공", "환영합니다! 프리미엄 멤버십이 활성화되었습니다. 🎉");
          }
      } catch (e) { if (!e.userCancelled) showAlert("결제 실패", e.message); }
  };

  const handleRestorePurchases = async () => {
      try {
          const restore = await Purchases.restorePurchases();
          if (restore.entitlements.active['premium']) {
              setIsPremium(true); if (userInfo) updateDoc(doc(db, "users", userInfo.uid), { isPremium: true });
              showAlert("복원 성공", "구매 내역을 복원했습니다.");
          } else showAlert("알림", "복원할 구매 내역이 없습니다.");
      } catch (e) { showAlert("오류", "구매 복원 중 오류가 발생했습니다."); }
  };

  const handleStockClick = (stock, index) => {
      if (!isPremium && index >= 2 && !unlockedStocks.includes(stock.id)) {
          setPendingStock(stock);
          if (isLoaded) try { show(); } catch(e) { showAlert("오류", "광고 로드 실패. 잠시 후 다시 시도해주세요."); load(); }
          else { showAlert("알림", "광고를 불러오는 중입니다. 잠시 후 다시 시도해주세요."); load(); }
      } else setSelectedStock(stock);
  };

  const handleShareApp = async () => {
      try {
          const result = await Share.share({
              message: 'DailyPick10: AI가 스윙 투자에 최적화된 상승 예상 종목을 매일 찾아줍니다! \n\n[다운로드 링크]\nhttps://ajazara-ops.github.io/dailypick10/', 
          });
          if (result.action === Share.sharedAction) {
              if (result.activityType) {
                  // shared with activity type of result.activityType
              } else {
                  // shared
              }
          } else if (result.action === Share.dismissedAction) {
              // dismissed
          }
      } catch (error) {
          Alert.alert(error.message);
      }
  };

  return (
    <SafeAreaProvider>
      <RNSafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" />

        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} onConfirm={alertConfig.onConfirm} confirmText={alertConfig.confirmText} showCancel={alertConfig.showCancel} onCancel={alertConfig.onCancel} />

        {showToast && (
             <View style={styles.toastContainer}>
                 <View style={styles.bgIcon}><Icon name="bell" size={14} color="#fff"/></View>
                 <Text style={styles.toastText}>{toastMessage}</Text>
                 <TouchableOpacity onPress={() => setShowToast(false)}><Icon name="x" size={16} color="#9CA3AF"/></TouchableOpacity>
             </View>
        )}

        {showSplash ? (
            <View style={[styles.container, styles.center]}>
                <View style={styles.splashIcon}><Icon name="swing" size={60} color="#fff" /></View>
                <Text style={styles.splashTitle}>Daily<Text style={{color:'#818CF8'}}>Pick10</Text></Text>
                <Text style={styles.splashSub}>AI 스마트 스윙 투자</Text>
            </View>
        ) : !userInfo ? (
            <LoginScreen onLogin={() => { if(isLoaded && !isPremium) { /*show();*/ } }} adUnitId={adUnitIdInterstitial} />
        ) : (
            <>
               {activeView !== 'SETTINGS' && (
                  <View style={styles.header}>
                    <View style={styles.headerRow}>
                      {isHistoryMode ? (
                        <TouchableOpacity onPress={handleBackToHistoryList} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Icon name="arrowLeft" color="#E5E7EB" />
                          <Text style={[styles.headerTitle, { marginLeft: 10 }]}>리포트 상세</Text>
                        </TouchableOpacity>
                      ) : activeView === 'HISTORY' ? (
                        <TouchableOpacity onPress={() => setActiveView('HOME')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Icon name="arrowLeft" color="#E5E7EB" />
                          <Text style={[styles.headerTitle, { marginLeft: 10 }]}>성과 리포트</Text>
                        </TouchableOpacity>
                      ) : activeView === 'NOTIFICATIONS' ? (
                        <TouchableOpacity onPress={() => setActiveView('HOME')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Icon name="arrowLeft" color="#E5E7EB" />
                          <Text style={[styles.headerTitle, { marginLeft: 10 }]}>알림함</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <Text style={styles.logoText}>Daily<Text style={{ color: '#818CF8' }}>Pick10</Text></Text>
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity onPress={() => setShowGuide(true)} style={styles.iconBtn}><Icon name="help" size={20} color="#9CA3AF" /></TouchableOpacity>
                            <TouchableOpacity onPress={handleRefresh} style={styles.iconBtn}>{loading ? <ActivityIndicator size="small" color="#9CA3AF" /> : <Icon name="refresh" size={20} color="#9CA3AF" />}</TouchableOpacity>
                          </View>
                        </>
                      )}
                      {activeView === 'NOTIFICATIONS' && notifications.length > 0 && (
                        <TouchableOpacity onPress={clearNotifications}><Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>전체 삭제</Text></TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {activeView === 'HOME' ? (
                  <ScrollView style={styles.scrollView} contentContainerStyle={{paddingBottom: 20}}>
                    {isHistoryMode ? <HistoryReport stocks={stocks} date={lastUpdated} /> : (
                        <>
                            {/* [신규] MarketBanner 위에 기준 날짜 표시 */}
                            {!isHistoryMode && lastUpdated && (
                                <View style={{paddingHorizontal: 20, marginTop: 10, flexDirection:'row', alignItems:'center', justifyContent:'flex-end'}}>
                                     <Icon name="clock" size={12} color="#6B7280" />
                                     <Text style={{color:'#6B7280', fontSize:11, marginLeft:4}}>{lastUpdated} 기준</Text>
                                </View>
                            )}
                            <MarketBanner marketStatus={marketStatus} />
                            {!isPremium && <AdBannerComponent adUnitId={adUnitIdBanner} />}
                            <View style={styles.tabContainer}>
                            {['US', 'KR', 'FAV'].map(tab => (
                                <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabBtn, activeTab===tab && styles.activeTabBtn]}>
                                <Icon name={tab==='US'?'globe':tab==='KR'?'chart':'starFilled'} size={14} color={activeTab===tab?'#fff':'#9CA3AF'} />
                                <Text style={[styles.tabText, activeTab===tab && styles.activeTabText]}>{tab==='US'?'미국':tab==='KR'?'한국':'내 종목'}</Text>
                                </TouchableOpacity>
                            ))}
                            </View>
                            <View style={styles.statusRow}>
                                <View style={styles.row}>
                                    <Icon name="shield" size={12} color="#9CA3AF" />
                                    <Text style={styles.statusText}>{loading ? "데이터 로딩 중..." : (error ? "연결 실패" : "AI 분석 완료")}</Text>
                                </View>
                                {isHistoryMode && <Text style={styles.historyBadge}>과거 데이터 열람 중</Text>}
                            </View>
                            {displayStocks.length === 0 ? (
                            <View style={styles.emptyView}>
                                <Icon name="star" size={40} color="#374151" />
                                <Text style={styles.emptyText}>{activeTab==='FAV'?'관심 종목이 없습니다.':'데이터가 없습니다.'}</Text>
                            </View>
                            ) : (
                            displayStocks.map((stock, idx) => (
                                <StockCard 
                                    // [수정] key 값을 stock.id + index 조합으로 만들어 중복 방지
                                    key={`${stock.id}-${idx}`} 
                                    stock={stock} 
                                    isFavorite={favorites.some(f => f.id === stock.id)} 
                                    isLocked={!isPremium && idx >= 2 && !unlockedStocks.includes(stock.id)} 
                                    onClick={() => handleStockClick(stock, idx)} 
                                    onUnlock={() => handleStockClick(stock, idx)} 
                                />
                            ))
                            )}
                        </>
                    )}
                  </ScrollView>
                ) : activeView === 'HISTORY' ? (
                    // [수정] HistoryView에 수정된 핸들러 전달
                   <HistoryView onSelectHistory={handleHistoryClick} onBack={() => setActiveView('HOME')} />
                ) : activeView === 'NOTIFICATIONS' ? (
                   <NotificationView notifications={notifications} onClear={clearNotifications} />
                ) : (
                    <SettingsView userInfo={userInfo} isPremium={isPremium} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} onPasswordReset={handlePasswordReset} onShowGuide={() => setShowGuide(true)} onPurchasePremium={handlePurchasePremium} onRestore={handleRestorePurchases} onShareApp={handleShareApp} />
                )}

                <View style={styles.bottomNav}>
                   <TouchableOpacity onPress={handleGoHome} style={styles.navBtn}><Icon name="home" color={activeView==='HOME' && !isHistoryMode ?'#60A5FA':'#6B7280'} size={24} /></TouchableOpacity>
                   <TouchableOpacity onPress={() => setActiveView('HISTORY')} style={styles.navBtn}><Icon name="history" color={activeView==='HISTORY'?'#60A5FA':'#6B7280'} size={24} /></TouchableOpacity>
                   <TouchableOpacity onPress={() => setActiveView('NOTIFICATIONS')} style={styles.navBtn}><Icon name="bell" color={activeView==='NOTIFICATIONS'?'#60A5FA':'#6B7280'} size={24} /></TouchableOpacity>
                   <TouchableOpacity onPress={() => setActiveView('SETTINGS')} style={styles.navBtn}><Icon name="settings" color={activeView==='SETTINGS'?'#60A5FA':'#6B7280'} size={24} /></TouchableOpacity>
                </View>
            </>
        )}

        {selectedStock && <StockDetail stock={selectedStock} onBack={() => setSelectedStock(null)} isFavorite={favorites.some(f => f.id === selectedStock.id)} onToggleFavorite={toggleFavorite} />}
        <GuideModal visible={showGuide} onClose={() => setShowGuide(false)} />
      </RNSafeAreaView>
    </SafeAreaProvider>
  );
}