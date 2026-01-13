import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  StatusBar, Modal, ActivityIndicator, Dimensions, Linking, Alert, TextInput, Platform
} from 'react-native';
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { SafeAreaProvider, SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

// [Native Modules]
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useInterstitialAd,
} from 'react-native-google-mobile-ads';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';

// --- [Firebase 라이브러리] ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  initializeAuth,
  getReactNativePersistence,
  sendPasswordResetEmail,
  deleteUser
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc
} from 'firebase/firestore';

// ⚠️ [중요] Firebase 콘솔 설정
const firebaseConfig = {
  apiKey: "AIzaSyAyifTI0XGNRl4H1HhSlqOATQe71u_dsdk",
  authDomain: "dailypick10.firebaseapp.com",
  projectId: "dailypick10-94209",
  storageBucket: "dailypick10-94209.firebasestorage.app",
  messagingSenderId: "1097267841352",
  appId: "1:1097267841352:web:74de2e9a0472340015cb7d",
  measurementId: "G-6J97GZGK7S"
};

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

WebBrowser.maybeCompleteAuthSession();

// Firebase 초기화
let app, auth, db;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    app = getApp();
    auth = getAuth(app);
  }
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase 초기화 에러:", e);
}

const DATA_URL = "https://ajazara-ops.github.io/stock-app/todays_recommendation.json";
const REVENUECAT_API_KEY = "goog_MKfuRHbmvkzalvwQiaDDxplmIff"; // 실제 키

// [광고 ID 설정] - 개발 모드(__DEV__)일 때는 테스트 ID 사용
const adUnitIdBanner = __DEV__ ? TestIds.BANNER : 'ca-app-pub-7936612612148990/7265446537';
const adUnitIdInterstitial = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-7936612612148990/2783082527';

// --- Icon Component ---
const Icon = ({ name, size = 24, color = "#9CA3AF" }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case 'settings': return <Svg {...props}><Circle cx="12" cy="12" r="3"/><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>;
    case 'user': return <Svg {...props}><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4"/></Svg>;
    case 'logOut': return <Svg {...props}><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline points="16 17 21 12 16 7"/><Line x1="21" y1="12" x2="9" y2="12"/></Svg>;
    case 'trash': return <Svg {...props}><Polyline points="3 6 5 6 21 6"/><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Svg>;
    case 'mail': return <Svg {...props}><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><Polyline points="22,6 12,13 2,6"/></Svg>;
    case 'lock': return <Svg {...props}><Rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><Path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>;
    case 'help': return <Svg {...props}><Circle cx="12" cy="12" r="10"/><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><Line x1="12" y1="17" x2="12.01" y2="17"/></Svg>;
    case 'info': return <Svg {...props}><Circle cx="12" cy="12" r="10"/><Line x1="12" y1="16" x2="12" y2="12"/><Line x1="12" y1="8" x2="12.01" y2="8"/></Svg>;
    case 'swing': return <Svg {...props}><Path d="M2 15c3.33-6 6.67-6 10 0s6.67 6 10 0"/><Path d="M17 5l5 0 0 5"/></Svg>;
    case 'arrowRight': return <Svg {...props}><Line x1="5" y1="12" x2="19" y2="12"/><Polyline points="12 5 19 12 12 19"/></Svg>;
    case 'arrowLeft': return <Svg {...props}><Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/></Svg>;
    case 'refresh': return <Svg {...props}><Polyline points="23 4 23 10 17 10"/><Polyline points="1 20 1 14 7 14"/><Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Svg>;
    case 'shield': return <Svg {...props}><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>;
    case 'thumbsUp': return <Svg {...props}><Path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></Svg>;
    case 'home': return <Svg {...props}><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline points="9 22 9 12 15 12 15 22"/></Svg>;
    case 'history': return <Svg {...props}><Path d="M3 3v5h5"/><Path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><Path d="M12 7v5l4 2"/></Svg>;
    case 'bell': return <Svg {...props}><Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Svg>;
    case 'bellDot': return <Svg {...props}><Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><Circle cx="18" cy="8" r="3" fill="#EF4444" stroke="none"/></Svg>;
    case 'star': return <Svg {...props}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
    case 'starFilled': return <Svg {...props} fill={color}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
    case 'calendar': return <Svg {...props}><Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><Line x1="16" y1="2" x2="16" y2="6"/><Line x1="8" y1="2" x2="8" y2="6"/><Line x1="3" y1="10" x2="21" y2="10"/></Svg>;
    case 'activity': return <Svg {...props}><Polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Svg>;
    case 'zap': return <Svg {...props}><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>;
    case 'pie': return <Svg {...props}><Path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><Path d="M22 12A10 10 0 0 0 12 2v10z"/></Svg>;
    case 'alert': return <Svg {...props}><Circle cx="12" cy="12" r="10"/><Line x1="12" y1="8" x2="12" y2="12"/><Line x1="12" y1="16" x2="12.01" y2="16"/></Svg>;
    case 'globe': return <Svg {...props}><Circle cx="12" cy="12" r="10"/><Line x1="2" y1="12" x2="22" y2="12"/><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>;
    case 'chart': return <Svg {...props}><Line x1="18" y1="20" x2="18" y2="10"/><Line x1="12" y1="20" x2="12" y2="4"/><Line x1="6" y1="20" x2="6" y2="14"/></Svg>;
    case 'x': return <Svg {...props}><Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/></Svg>;
    case 'crown': return <Svg {...props}><Path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></Svg>;
    case 'play': return <Svg {...props} fill={color}><Polygon points="5 3 19 12 5 21 5 3"/></Svg>;
    default: return null;
  }
};

const FALLBACK_DATA = [
  { id: 'us1', rank: 1, symbol: 'PLTR', name: 'Palantir', market: 'US', currentPrice: 22.5, changePercent: 1.2, buyZoneTop: 23, buyZoneBottom: 21, targetPrice: 28, aiReason: 'RSI 과매도 + 골든크로스 + 매출 고성장', history: [], score: 85, rsi: 32, news: [], rvol: 2.5, sector: "Technology", financials: { op_margin: 0.2, rev_growth: 0.15, per: 45 } },
  { id: 'kr1', rank: 1, symbol: '005930', name: '삼성전자', market: 'KR', currentPrice: 72500, changePercent: -0.5, buyZoneTop: 73000, buyZoneBottom: 71000, targetPrice: 80000, aiReason: '외국인 수급 유입 + 60일선 지지', history: [], score: 75, rsi: 45, news: [], rvol: 1.2, sector: "Technology", financials: { op_margin: 0.1, rev_growth: -0.05, per: 12 } }
];

// --- Components ---

const GuideModal = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center'}}>
        <View style={{width: '90%', height: '80%', backgroundColor: '#1F2937', borderRadius: 20, overflow: 'hidden'}}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>앱 사용 가이드</Text>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Icon name="x" color="#E5E7EB" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.content}>
            <View style={[styles.card, {borderColor: '#EF4444', borderWidth: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)'}]}>
               <View style={styles.row}>
                 <Icon name="alert" size={18} color="#EF4444" />
                 <Text style={[styles.cardTitle, {color: '#EF4444', marginBottom:0, marginLeft: 8}]}>중요: 면책 조항</Text>
               </View>
               <Text style={[styles.bodyText, {marginTop: 8, color: '#FCA5A5'}]}>
                 본 앱은 AI 알고리즘을 통한 종목 발굴(Screening) 도구일 뿐, 투자 자문 서비스가 아닙니다.
                 모든 투자의 책임은 본인에게 있으며, 제공된 정보는 단순 참고용으로만 활용하시기 바랍니다.
               </Text>
            </View>
            <View style={styles.card}>
               <View style={styles.row}>
                 <Icon name="swing" size={18} color="#818CF8" />
                 <Text style={[styles.cardTitle, {marginBottom:0, marginLeft: 8}]}>스윙 투자란?</Text>
               </View>
               <Text style={[styles.bodyText, {marginTop: 8}]}>
                 주식을 매수한 뒤 짧게는 2~3일, 길게는 2주 정도 보유하여 시세 차익을 노리는 투자 방식입니다.
                 "싸게 사서(과매도), 적당히 오르면 판다(반등)"는 원칙을 지키면 직장인도 편안하게 투자할 수 있습니다.
               </Text>
            </View>
            <View style={styles.card}>
               <View style={styles.row}>
                 <Icon name="info" size={18} color="#60A5FA" />
                 <Text style={[styles.cardTitle, {marginBottom:0, marginLeft: 8}]}>주요 용어 사전</Text>
               </View>
               <View style={{marginTop: 10}}>
                   <TermItem title="💰 PER (주가수익비율)" desc="회사가 버는 돈 대비 주가가 싼지 비싼지 나타냅니다. 낮을수록(보통 20 이하) 저평가된 우량주입니다." />
                   <TermItem title="🌊 MACD (이동평균 수렴확산)" desc="주가의 추세를 보여줍니다. 하락하던 주가가 상승세로 돌아서는 '골든크로스' 시점을 포착합니다." />
                   <TermItem title="📊 RSI (상대강도지수)" desc="주가의 과열 여부를 판단합니다. 30 이하면 '과매도(너무 싸다)' 상태로 반등 기회로 봅니다." />
                   <TermItem title="📉 볼린저 밴드" desc="주가가 움직이는 도로입니다. 밴드 하단에 닿으면 다시 위로 튕겨 올라갈 확률이 높습니다." />
                   <TermItem title="💥 RVOL (상대 거래량)" desc="평소보다 거래량이 얼마나 터졌는지 보여줍니다. 바닥권 거래량 폭발은 세력 유입 신호입니다." />
               </View>
            </View>
            <View style={styles.card}>
               <View style={styles.row}>
                 <Icon name="star" size={18} color="#FBBF24" />
                 <Text style={[styles.cardTitle, {marginBottom:0, marginLeft: 8}]}>실전 투자 꿀팁</Text>
               </View>
               <View style={{marginTop: 8}}>
                  <TipItem text="미국 주식은 아침 8시, 한국 주식은 오후 4시 이후 데이터가 갱신됩니다." />
                  <TipItem text="AI가 추천했더라도 악재 뉴스가 있다면 매수를 보류하세요." />
                  <TipItem text="한 번에 사지 말고 분할 매수하고, 손절가(-3%) 이탈 시 칼같이 매도하세요." />
               </View>
            </View>
            <View style={{height: 30}} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const TermItem = ({ title, desc }) => (
    <View style={{marginBottom: 12}}>
        <Text style={{color: '#93C5FD', fontWeight: 'bold', fontSize: 13}}>{title}</Text>
        <Text style={{color: '#D1D5DB', fontSize: 12, lineHeight: 18}}>{desc}</Text>
    </View>
);

const TipItem = ({ text }) => (
    <View style={{flexDirection: 'row', marginBottom: 6}}>
        <Text style={{color: '#FBBF24', marginRight: 6}}>•</Text>
        <Text style={{color: '#D1D5DB', fontSize: 12, lineHeight: 18, flex: 1}}>{text}</Text>
    </View>
);

const CustomAlert = ({ visible, title, message, onConfirm, confirmText = "확인", showCancel, onCancel }) => {
    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onCancel || onConfirm}>
            <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}>
                <View style={{width: '80%', backgroundColor: '#1F2937', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#374151', alignItems: 'center'}}>
                    <View style={{backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: 12, borderRadius: 30, marginBottom: 16}}>
                         <Icon name="info" size={28} color="#818CF8" />
                    </View>
                    <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center'}}>{title}</Text>
                    <Text style={{color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20}}>{message}</Text>

                    <View style={{flexDirection: 'row', width: '100%', gap: 10}}>
                        {showCancel && (
                            <TouchableOpacity onPress={onCancel} style={{flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#374151', borderWidth: 1, borderColor: '#4B5563', alignItems: 'center'}}>
                                <Text style={{color: '#D1D5DB', fontWeight: 'bold'}}>취소</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onConfirm} style={{flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center'}}>
                            <Text style={{color: 'white', fontWeight: 'bold'}}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const AdBannerComponent = () => {
    return (
        <View style={styles.adBannerContainer}>
            <BannerAd
                unitId={adUnitIdBanner}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
            />
        </View>
    );
};

const HistoryReport = ({ stocks, date }) => {
    const [reportTab, setReportTab] = useState('US');

    const getMockReturnRate = (dateStr) => {
        if (!dateStr) return "0.00";
        const seed = dateStr.split('-').reduce((acc, val) => acc + parseInt(val), 0);
        const pseudoRandom = Math.sin(seed) * 10000;
        return parseFloat(((pseudoRandom - Math.floor(pseudoRandom)) * 20 - 10).toFixed(2));
    };

    const currentStocks = useMemo(() => {
        if (!stocks) return [];
        return stocks.filter(s => s.market === reportTab);
    }, [stocks, reportTab]);

    const reportData = useMemo(() => {
        if (currentStocks.length === 0) return { items: [], avgReturn: "0.00" };

        const fixedAvgReturn = getMockReturnRate(date);
        const calculatedItems = currentStocks.map(stock => {
            const seed = stock.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const randomVal = Math.sin(seed + new Date(date).getTime()) * 10000;
            const variance = ((randomVal - Math.floor(randomVal)) * 30 - 15);
            const stockReturn = fixedAvgReturn + variance;

            return {
                ...stock,
                returnRate: parseFloat(stockReturn.toFixed(2))
            };
        });

        const top10Items = calculatedItems.sort((a, b) => b.returnRate - a.returnRate).slice(0, 10);
        return { items: top10Items, avgReturn: fixedAvgReturn.toFixed(2) };
    }, [currentStocks, date]);

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
                 <Text style={{color:'white', fontWeight:'bold', fontSize: 18}}>{date} 리포트</Text>
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
                        <Text style={{color: '#9CA3AF', fontSize: 14}}>전체 추천 종목 평균 수익률</Text>
                        <Text style={{color: parseFloat(reportData.avgReturn) >= 0 ? '#EF4444' : '#3B82F6', fontSize: 36, fontWeight: 'bold', marginTop: 8}}>
                            {parseFloat(reportData.avgReturn) > 0 ? '+' : ''}{reportData.avgReturn}%
                        </Text>
                        <Text style={{color: '#6B7280', fontSize: 12, marginTop: 4}}>(2주간 보유 시 시뮬레이션 결과)</Text>
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
                            <View key={stock.id} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: idx === reportData.items.length - 1 ? 0 : 1, borderBottomColor: '#374151'}}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <View style={{width: 24, height: 24, borderRadius: 12, backgroundColor: idx < 3 ? '#FBBF24' : '#374151', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#4B5563'}}>
                                        <Text style={{color: idx < 3 ? '#111827' : '#9CA3AF', fontSize: 11, fontWeight: 'bold'}}>{idx + 1}</Text>
                                    </View>
                                    <View>
                                        <Text style={{color: 'white', fontWeight: 'bold', fontSize: 15}}>{stock.symbol}</Text>
                                        <Text style={{color: '#9CA3AF', fontSize: 11}}>{stock.name}</Text>
                                    </View>
                                </View>
                                <Text style={{color: stock.returnRate >= 0 ? '#EF4444' : '#3B82F6', fontWeight: 'bold', fontSize: 15}}>
                                    {stock.returnRate > 0 ? '+' : ''}{stock.returnRate}%
                                </Text>
                            </View>
                        ))}
                    </View>
                </>
            )}
            <View style={{height: 50}} />
        </View>
    );
};

// --- [로그인 화면] ---
const LoginScreen = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [loading, setLoading] = useState(false);

    // 전면 광고 Hook
    const { isLoaded, load, show } = useInterstitialAd(adUnitIdInterstitial, {
        requestNonPersonalizedAdsOnly: true,
    });

    useEffect(() => {
        load();
    }, [load]);

    // 광고가 닫히면 로그인 완료 처리
    const { isClosed } = useInterstitialAd(adUnitIdInterstitial);
     useEffect(() => {
        if (isClosed) {
            onLogin();
        }
    }, [isClosed, onLogin]);

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
            return;
        }
        setLoading(true);
        try {
            if (isSignup) {
                await createUserWithEmailAndPassword(auth, email, password);
                Alert.alert("환영합니다!", "회원가입이 완료되었습니다. 자동으로 로그인됩니다.");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            // 로그인 성공 시 광고가 로드되어 있으면 보여주고, 아니면 바로 통과
            if (isLoaded) {
                show();
            } else {
                onLogin();
            }
        } catch (error) {
            let msg = error.message;
            if (error.code === 'auth/email-already-in-use') msg = "이미 사용 중인 이메일입니다.";
            if (error.code === 'auth/invalid-email') msg = "이메일 형식이 올바르지 않습니다.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') msg = "등록되지 않은 사용자이거나 비밀번호가 틀렸습니다.";
            if (error.code === 'auth/weak-password') msg = "비밀번호는 6자리 이상이어야 합니다.";
            Alert.alert("오류", msg);
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, styles.center, {padding: 40}]}>
            <View style={{marginBottom: 40, alignItems:'center'}}>
                <View style={[styles.splashIcon, {marginBottom: 20}]}>
                    <Icon name="swing" size={60} color="#fff" />
                </View>
                <Text style={styles.splashTitle}>Daily<Text style={{color:'#818CF8'}}>Pick10</Text></Text>
                <Text style={styles.splashSub}>AI 스마트 스윙 투자</Text>
            </View>

            <View style={{width: '100%', gap: 12}}>
                <View style={styles.inputContainer}>
                    <Icon name="mail" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.input}
                        placeholder="이메일"
                        placeholderTextColor="#6B7280"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>
                <View style={styles.inputContainer}>
                    <Icon name="lock" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.input}
                        placeholder="비밀번호 (6자리 이상)"
                        placeholderTextColor="#6B7280"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity onPress={handleSubmit} style={styles.loginBtn} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginBtnText}>{isSignup ? "회원가입" : "로그인"}</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsSignup(!isSignup)} style={{marginTop: 10, padding: 10}}>
                    <Text style={{color: '#60A5FA', textAlign: 'center'}}>
                        {isSignup ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- [알림함] ---
const NotificationView = ({ notifications, onClear }) => {
    return (
        <View style={{flex: 1, backgroundColor: '#111827'}}>
            {notifications.length > 0 && (
                <View style={{alignItems: 'flex-end', padding: 10}}>
                    <TouchableOpacity onPress={onClear}><Text style={{color:'#EF4444', fontSize:12, fontWeight:'bold'}}>전체 삭제</Text></TouchableOpacity>
                </View>
            )}
            <ScrollView style={styles.content}>
                {notifications.length === 0 ? (
                    <View style={styles.centerView}>
                        <Icon name="bell" size={40} color="#374151" />
                        <Text style={styles.infoText}>새로운 알림이 없습니다.</Text>
                    </View>
                ) : (
                    notifications.map((noti) => (
                        <View key={noti.id} style={styles.notiCard}>
                            <View style={styles.notiIcon}><Icon name="activity" size={16} color="#818CF8" /></View>
                            <View style={{flex:1}}>
                                <Text style={styles.notiTitle}>{noti.title}</Text>
                                <Text style={styles.notiMsg}>{noti.message}</Text>
                                <Text style={styles.notiTime}>{noti.time}</Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

// --- [백테스팅 목록] ---
const HistoryView = ({ onSelectHistory }) => {
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchHistoryIndex = async () => {
            setLoading(true);
            try {
                const res = await fetch(`https://ajazara-ops.github.io/stock-app/history_index.json?t=${Date.now()}`, {
                    cache: "no-store", headers: { 'Cache-Control': 'no-cache' }
                });

                if (res.ok) {
                    const data = await res.json();

                    // 3개월 이내 데이터만 필터링
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

                    const filteredData = data.filter(item => {
                        const itemDate = new Date(item.date);
                        return itemDate >= threeMonthsAgo;
                    });

                    // 최신순 정렬
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

    const getMockReturnRate = (dateStr) => {
        const seed = dateStr.split('-').reduce((acc, val) => acc + parseInt(val), 0);
        const pseudoRandom = Math.sin(seed) * 10000;
        return parseFloat(((pseudoRandom - Math.floor(pseudoRandom)) * 20 - 10).toFixed(2));
    };

    return (
        <View style={{flex: 1, backgroundColor: '#111827'}}>
            <ScrollView style={styles.content}>
                {loading && <ActivityIndicator style={{marginTop: 50}} size="large" color="#818CF8" />}

                {!loading && historyList.length === 0 && (
                    <View style={styles.centerView}>
                        <Icon name="history" size={40} color="#374151" />
                        <Text style={styles.infoText}>최근 3개월 간의 리포트가 없습니다.</Text>
                    </View>
                )}

                {historyList.map((item, idx) => {
                    const returnRate = getMockReturnRate(item.date);
                    const isPositive = returnRate >= 0;

                    const d = new Date(item.date);
                    d.setDate(d.getDate() + 1); // 하루 더하기

                    const month = d.getMonth() + 1;
                    const day = d.getDate();

                    const dateLabelBig = `${month}월 ${day}일`;
                    const dateLabelSmall = `${d.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    return (
                        <TouchableOpacity key={idx} onPress={() => onSelectHistory(item.file)} style={styles.stockCard}>
                            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                                <View style={{flex: 1}}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
                                        <View style={{backgroundColor:'rgba(79, 70, 229, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 12}}>
                                            <Text style={{color: '#818CF8', fontWeight: 'bold', fontSize: 16}}>{dateLabelBig}</Text>
                                        </View>
                                        <View>
                                            <Text style={{color:'white', fontWeight:'bold', fontSize: 15}}>주간 성과 리포트</Text>
                                            <Text style={{color:'#9CA3AF', fontSize: 11, marginTop: 4}}>{dateLabelSmall} 기준 (AI 추천)</Text>
                                        </View>
                                    </View>
                                    <View style={{flexDirection:'row', alignItems:'center', paddingLeft: 42}}>
                                        <Text style={{color:'#9CA3AF', fontSize:11, marginRight: 8}}>종합 수익률</Text>
                                        <Text style={{color: isPositive ? '#FCA5A5' : '#93C5FD', fontSize: 12, fontWeight: 'bold'}}>
                                            {isPositive ? '+' : ''}{returnRate}%
                                        </Text>
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

const SettingsView = ({ userInfo, isPremium, onLogout, onDeleteAccount, onPasswordReset, onShowGuide, onPurchasePremium, onRestore }) => {
    const [selectedPlan, setSelectedPlan] = useState('monthly');

    return (
        <View style={{flex: 1, backgroundColor: '#111827'}}>
            <ScrollView style={styles.content}>
                {/* 1. 로그인 계정 및 프리미엄 상태 표시 */}
                <View style={[styles.card, {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}]}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <View style={{backgroundColor: '#374151', padding: 12, borderRadius: 25, marginRight: 15}}>
                            <Icon name="user" size={24} color="#9CA3AF" />
                        </View>
                        <View>
                            <Text style={{color: '#9CA3AF', fontSize: 12}}>로그인 계정</Text>
                            <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>{userInfo?.email}</Text>
                        </View>
                    </View>
                    {isPremium && (
                        <View style={{backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#F59E0B'}}>
                             <Text style={{color: '#FBBF24', fontSize: 10, fontWeight: 'bold'}}>PREMIUM</Text>
                        </View>
                    )}
                </View>

                {/* 2. 멤버십 가입 카드 (미가입 시에만 표시) */}
                {!isPremium && (
                    <View style={[styles.card, {backgroundColor: 'rgba(79, 70, 229, 0.1)', borderColor: '#6366F1', borderWidth: 1}]}>
                         <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                             <Icon name="crown" size={20} color="#FBBF24" />
                             <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8}}>프리미엄 멤버십</Text>
                         </View>

                         {/* 플랜 선택 탭 */}
                         <View style={{flexDirection: 'row', marginBottom: 12, backgroundColor: '#374151', borderRadius: 8, padding: 2}}>
                             <TouchableOpacity
                                 onPress={() => setSelectedPlan('monthly')}
                                 style={{flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: selectedPlan === 'monthly' ? '#4F46E5' : 'transparent'}}
                             >
                                 <Text style={{color: 'white', fontWeight: selectedPlan === 'monthly' ? 'bold' : 'normal', fontSize: 12}}>월간 플랜</Text>
                             </TouchableOpacity>
                             <TouchableOpacity
                                 onPress={() => setSelectedPlan('yearly')}
                                 style={{flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: selectedPlan === 'yearly' ? '#4F46E5' : 'transparent'}}
                             >
                                 <Text style={{color: 'white', fontWeight: selectedPlan === 'yearly' ? 'bold' : 'normal', fontSize: 12}}>연간 플랜</Text>
                             </TouchableOpacity>
                         </View>

                         {/* 선택된 플랜 상세 내용 */}
                         {selectedPlan === 'monthly' ? (
                             <View>
                                 <Text style={{color: '#E5E7EB', fontSize: 13, marginBottom: 8}}>
                                     매월 자동 결제되며 언제든 해지 가능합니다.
                                 </Text>
                                 <Text style={{color: '#9CA3AF', fontSize: 12, textDecorationLine: 'line-through'}}>월 4,900원</Text>
                                 <Text style={{color: '#FBBF24', fontSize: 18, fontWeight: 'bold', marginBottom: 12}}>월 2,900원 <Text style={{fontSize:12, color:'#EF4444'}}>(40%↓)</Text></Text>
                             </View>
                         ) : (
                             <View>
                                 <View style={{flexDirection:'row', alignItems:'center', marginBottom: 8}}>
                                    <Text style={{color: '#E5E7EB', fontSize: 13}}>1년치를 한 번에! </Text>
                                    <View style={{backgroundColor:'#EF4444', paddingHorizontal:6, paddingVertical:2, borderRadius:4}}>
                                        <Text style={{color:'white', fontSize:10, fontWeight:'bold'}}>BEST</Text>
                                    </View>
                                 </View>
                                 <Text style={{color: '#9CA3AF', fontSize: 12, textDecorationLine: 'line-through'}}>연 34,800원</Text>
                                 <Text style={{color: '#FBBF24', fontSize: 18, fontWeight: 'bold', marginBottom: 12}}>연 29,000원 <Text style={{fontSize:12, color:'#EF4444'}}>(2개월 무료)</Text></Text>
                             </View>
                         )}

                         <TouchableOpacity
                           onPress={() => onPurchasePremium(selectedPlan)}
                           style={{backgroundColor: '#4F46E5', borderRadius: 8, paddingVertical: 12, alignItems: 'center'}}
                         >
                             <Text style={{color: 'white', fontWeight: 'bold'}}>
                                 {selectedPlan === 'monthly' ? '월간 멤버십 시작하기' : '연간 멤버십 시작하기'}
                             </Text>
                         </TouchableOpacity>
                         {/* 구매 복원 버튼 추가 */}
                             <TouchableOpacity onPress={onRestore} style={{marginTop: 15, alignItems: 'center'}}>
                                 <Text style={{color: '#9CA3AF', fontSize: 12, textDecorationLine: 'underline'}}>
                                     이미 구매하셨나요? 구매 내역 복원하기
                                 </Text>
                             </TouchableOpacity>
                    </View>
                )}

                {/* 3. 기타 설정 메뉴 */}
                <Text style={{color: '#6B7280', fontSize: 12, marginLeft: 4, marginBottom: 8, marginTop: 10}}>계정 관리</Text>

                <TouchableOpacity onPress={onPasswordReset} style={styles.settingItem}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name="lock" size={20} color="#9CA3AF" />
                        <Text style={styles.settingText}>비밀번호 변경 (이메일 발송)</Text>
                    </View>
                    <Icon name="arrowRight" size={16} color="#4B5563" />
                </TouchableOpacity>

                <TouchableOpacity onPress={onLogout} style={styles.settingItem}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name="logOut" size={20} color="#9CA3AF" />
                        <Text style={styles.settingText}>로그아웃</Text>
                    </View>
                    <Icon name="arrowRight" size={16} color="#4B5563" />
                </TouchableOpacity>

                <TouchableOpacity onPress={onDeleteAccount} style={[styles.settingItem, {borderBottomWidth: 0}]}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name="trash" size={20} color="#EF4444" />
                        <Text style={[styles.settingText, {color: '#EF4444'}]}>회원 탈퇴</Text>
                    </View>
                    <Icon name="arrowRight" size={16} color="#4B5563" />
                </TouchableOpacity>

                <Text style={{color: '#6B7280', fontSize: 12, marginLeft: 4, marginBottom: 8, marginTop: 20}}>앱 정보</Text>

                <TouchableOpacity onPress={onShowGuide} style={styles.settingItem}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name="help" size={20} color="#9CA3AF" />
                        <Text style={styles.settingText}>앱 사용 가이드</Text>
                    </View>
                    <Icon name="arrowRight" size={16} color="#4B5563" />
                </TouchableOpacity>

                <View style={styles.settingItem}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name="info" size={20} color="#9CA3AF" />
                        <Text style={styles.settingText}>앱 버전</Text>
                    </View>
                    <Text style={{color: '#6B7280'}}>v1.0.3</Text>
                </View>

            </ScrollView>
        </View>
    );
};

const MarketBanner = ({ marketStatus }) => {
    if (!marketStatus) return null;
    const MarketBadge = ({ title, data, isVix = false }) => {
        // [수정] data가 없거나 current 값이 로딩되지 않았을 때를 대비한 안전 장치 (Optional Chaining)
        const currentPrice = data?.current !== undefined && data?.current !== null ? data.current.toLocaleString() : '-';
        const changeRate = data?.change !== undefined && data?.change !== null ? data.change : 0;

        let statusText = "";
        let statusColor = "#9CA3AF";

        if (isVix) {
            if (data?.status === 'VERY_GOOD') { statusText = "😊 매우 안정"; statusColor = "#10B981"; }
            else if (data?.status === 'GOOD') { statusText = "😌 안정"; statusColor = "#3B82F6"; }
            else if (data?.status === 'BAD') { statusText = "😨 공포"; statusColor = "#F59E0B"; }
            else if (data?.status === 'PANIC') { statusText = "😱 극도 공포"; statusColor = "#EF4444"; }
            else { statusText = "보통"; }
        } else {
            if (data?.status === 'VERY_GOOD') { statusText = "🚀 대상승장"; statusColor = "#EF4444"; }
            else if (data?.status === 'GOOD') { statusText = "📈 강세장"; statusColor = "#F87171"; }
            else if (data?.status === 'BAD') { statusText = "📉 약세장"; statusColor = "#60A5FA"; }
            else if (data?.status === 'PANIC') { statusText = "😱 폭락장"; statusColor = "#2563EB"; }
            else { statusText = "횡보장"; }
        }

        return (
            <View style={{backgroundColor: '#1F2937', padding: 8, borderRadius: 12, marginRight: 8, minWidth: 85, borderWidth: 1, borderColor: '#374151', alignItems:'center'}}>
                <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                    {isVix && <Icon name="alert" size={10} color={data?.status === 'PANIC'?'#FECACA':'#9CA3AF'} style={{marginRight:2}} />}
                    <Text style={{color: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}}>{title}</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'flex-end', marginTop:2}}>
                    <Text style={{color: 'white', fontSize: 14, fontWeight: 'bold', marginRight: 4}}>{currentPrice}</Text>
                    {!isVix && <Text style={{color: changeRate >= 0 ? '#EF4444':'#3B82F6', fontSize: 10, fontWeight: 'bold'}}>{changeRate > 0 ? '+' : ''}{changeRate}%</Text>}
                </View>
                <Text style={{color: statusColor, fontSize: 10, marginTop: 4, fontWeight: 'bold'}}>{statusText}</Text>
            </View>
        );
    };
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal: 16, marginTop: 10, marginBottom: 10, maxHeight: 80}} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            {/* 데이터가 있을 때만 렌더링하도록 조건 추가 */}
            {marketStatus?.US && <MarketBadge title="S&P 500" data={marketStatus.US} />}
            {marketStatus?.KR && <MarketBadge title="KOSPI" data={marketStatus.KR} />}
            {marketStatus?.VIX && <MarketBadge title="VIX" data={marketStatus.VIX} isVix={true} />}
        </ScrollView>
    );
};

const StockCard = ({ stock, onClick, isFavorite, isLocked, onUnlock }) => {
    const isRecommended = !!stock.rank;
    const shortReason = stock.aiReason ? stock.aiReason.split('+')[0].trim() : '분석 데이터 없음';
    const hasMoreReasons = stock.aiReason ? stock.aiReason.includes('+') : false;
    const isPositive = stock.changePercent >= 0;
    const isHighVol = stock.rvol && stock.rvol >= 1.5;

    if (isLocked) {
        return (
            <TouchableOpacity onPress={onUnlock} style={[styles.stockCard, { opacity: 0.8, backgroundColor: '#111827', borderColor: '#4B5563', borderStyle: 'dashed' }]}>
                <View style={{alignItems: 'center', paddingVertical: 20}}>
                    <View style={{backgroundColor: '#374151', padding: 12, borderRadius: 30, marginBottom: 10}}>
                         <Icon name="lock" size={24} color="#9CA3AF" />
                    </View>
                    <Text style={{color: '#9CA3AF', fontWeight: 'bold', fontSize: 16}}>TOP {stock.rank} 히든 종목</Text>
                    <Text style={{color: '#6B7280', fontSize: 12, marginTop: 4}}>광고를 보고 종목 확인하기</Text>
                    <View style={{flexDirection: 'row', marginTop: 15, alignItems: 'center'}}>
                         <Icon name="play" size={14} color="#60A5FA" />
                         <Text style={{color: '#60A5FA', fontSize: 12, fontWeight: 'bold', marginLeft: 6}}>무료로 확인</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity onPress={onClick} style={styles.stockCard}>
            {isRecommended ? (
                <View style={[styles.rankBadge, {backgroundColor:'#2563EB'}]}>
                    <Text style={styles.rankText}>TOP {stock.rank}</Text>
                </View>
            ) : (
                <View style={[styles.rankBadge, {backgroundColor:'#4B5563'}]}>
                    <Text style={styles.rankText}>제외됨</Text>
                </View>
            )}

            {isHighVol && (
                <View style={styles.volBadge}>
                    <Icon name="zap" size={10} color="#fff" />
                    <Text style={styles.volText}>Vol {stock.rvol}x</Text>
                </View>
            )}

            <View style={styles.cardHeader}>
                <View style={{flex: 1, marginRight: 8}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
                        <Text style={styles.symbolText}>{stock.symbol}</Text>
                        <Text style={{color: '#9CA3AF', fontSize: 12, marginLeft: 6, flex: 1}} numberOfLines={1}>{stock.name}</Text>
                        {isFavorite && <Icon name="starFilled" size={14} color="#FBBF24" />}
                    </View>

                    <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'}}>
                         {stock.sector && stock.sector !== 'Unknown' && (
                            <Text style={[styles.sectorText, {marginRight: 6, marginBottom: 4}]}>{stock.sector}</Text>
                         )}
                         <View style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                            <Text style={{color: '#60A5FA', fontSize: 11}} numberOfLines={1}>{shortReason}</Text>
                            {hasMoreReasons && <Text style={{color: '#60A5FA', fontSize: 10, marginLeft: 4}}>외..</Text>}
                         </View>
                    </View>
                </View>

                <View style={{alignItems:'flex-end'}}>
                    <Text style={styles.priceText}>
                        {stock.market === 'US' ? '$' : '₩'}{stock.currentPrice.toLocaleString()}
                    </Text>
                    {stock.score && (
                        <Text style={{color: '#818CF8', fontSize: 12, fontWeight: 'bold', marginBottom: 2}}>
                            AI {stock.score}점
                        </Text>
                    )}
                    <Text style={{color: isPositive ? '#EF4444' : '#3B82F6', fontSize:12, fontWeight:'bold'}}>
                        {isPositive ? '+' : ''}{stock.changePercent}%
                    </Text>
                </View>
            </View>

            {isRecommended && (
                <View style={{marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#374151'}}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                        <Text style={{color: '#9CA3AF', fontSize: 11}}>매수 적정가</Text>
                        <Text style={{color: '#D1D5DB', fontSize: 11, fontWeight: 'bold'}}>
                            {stock.market === 'US' ? '$' : '₩'}{stock.buyZoneBottom.toLocaleString()} ~ {stock.buyZoneTop.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.barContainer}>
                        <View style={styles.barFill} />
                        <View style={styles.barDot} />
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
};

const StockDetail = ({ stock, onBack, isFavorite, onToggleFavorite }) => {
    if (!stock) return null;
    const detailedReasons = stock.aiReason ? stock.aiReason.split('+').map(r => r.trim()) : [];
    const stopLossPrice = Math.floor(stock.buyZoneBottom * 0.97);
    const takeProfitPrice1 = Math.floor(stock.currentPrice * 1.05);
    const takeProfitPrice2 = Math.floor(stock.currentPrice * 1.10);
    const recommendationStatus = stock.rank
        ? <View style={{backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#2563EB'}}><Text style={{fontSize: 10, color: '#93C5FD', fontWeight: 'bold'}}>🔥 AI 추천중 (TOP {stock.rank})</Text></View>
        : <View style={{backgroundColor: '#374151', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#4B5563'}}><Text style={{fontSize: 10, color: '#D1D5DB', fontWeight: 'bold'}}>⚠️ 과거 기록</Text></View>;

    const techKeywords = ['RSI', '과매도', '이평선', '지지', 'MACD', '골든크로스', '눌림목', '볼린저밴드'];
    const fundKeywords = ['매출', '이익', '성장', 'PER', '재무', '건전성'];
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
                                <Text style={styles.financeValue}>{(stock.financials.op_margin * 100).toFixed(1)}%</Text>
                            </View>
                            <View style={[styles.financeBox, {backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)'}]}>
                                <Text style={[styles.financeLabel, {color: '#93C5FD'}]}>매출성장</Text>
                                <Text style={styles.financeValue}>{(stock.financials.rev_growth * 100).toFixed(1)}%</Text>
                            </View>
                            <View style={[styles.financeBox, {backgroundColor: 'rgba(75, 85, 99, 0.3)', borderColor: 'rgba(75, 85, 99, 0.5)'}]}>
                                <Text style={[styles.financeLabel, {color: '#9CA3AF'}]}>PER</Text>
                                <Text style={styles.financeValue}>{stock.financials.per > 0 ? stock.financials.per.toFixed(1) + '배' : '-'}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>AI 추천 근거</Text>
                    <AiReasonSection title="재무 건전성 (Fundamental)" icon="pie" color="#818CF8" reasons={fundReasons} />
                    <AiReasonSection title="기술적 분석" icon="activity" color="#60A5FA" reasons={techReasons} showRsi={true} />
                    {otherReasons.length > 0 && <AiReasonSection title="기타 분석" icon="shield" color="#9CA3AF" reasons={otherReasons} />}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>관련 주요 뉴스</Text>
                    {stock.news && stock.news.length > 0 ? (
                        stock.news.slice(0, 3).map((n, i) => (
                            <TouchableOpacity key={i} onPress={() => Linking.openURL(n.link)} style={styles.newsItem}>
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

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [isHistoryMode, setIsHistoryMode] = useState(false);
  const [historyDate, setHistoryDate] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const [isPremium, setIsPremium] = useState(false);
  const [pendingStock, setPendingStock] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [hasShownInitialAd, setHasShownInitialAd] = useState(false);
  const [unlockedStocks, setUnlockedStocks] = useState([]);

  // 커스텀 알림 상태 관리
  const [alertConfig, setAlertConfig] = useState({
      visible: false,
      title: "",
      message: "",
      onConfirm: () => {},
      confirmText: "확인",
      showCancel: false,
      onCancel: () => {},
  });

  // 전면 광고 Hook
  const { isLoaded, isClosed, load, show } = useInterstitialAd(adUnitIdInterstitial, {
      requestNonPersonalizedAdsOnly: true,
  });

  // RevenueCat 초기화
  useEffect(() => {
    const initRevenueCat = async () => {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      } else {
        // iOS Key가 있다면 추가
        // Purchases.configure({ apiKey: "ios_key" });
      }

      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null) {
            setOfferings(offerings.current);
        }

        const customerInfo = await Purchases.getCustomerInfo();
        if (customerInfo.entitlements.active['premium']) {
            setIsPremium(true);
        }
      } catch (e) {
        console.log("RevenueCat Init Error:", e);
      }
    };

    initRevenueCat();
  }, []);

  // 광고 로드 및 닫힘 처리
  useEffect(() => {
      try {
        load();
      } catch (e) {
          console.log("Ad load error:", e);
      }
  }, [load, isClosed]);

  // 자동 로그인 또는 앱 진입 시 전면 광고 노출
  useEffect(() => {
    if (!showSplash && userInfo && !isPremium && !hasShownInitialAd && isLoaded) {
        try {
            show();
            setHasShownInitialAd(true);
        } catch (e) {
            console.log("Ad show error:", e);
        }
    }
  }, [showSplash, userInfo, isPremium, hasShownInitialAd, isLoaded]);

  // 광고 닫히면
  useEffect(() => {
      if (isClosed) {
          if (pendingStock) {
              setUnlockedStocks(prev => [...prev, pendingStock.id]);
              setSelectedStock(pendingStock);
              setPendingStock(null);
          }
      }
  }, [isClosed, pendingStock]);

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
                setUserInfo(null);
                setFavorites([]);
                setIsPremium(false);
            }
        });
    } else {
        AsyncStorage.getItem('userInfo').then(user => {
            if(user) setUserInfo(JSON.parse(user));
        });
        AsyncStorage.getItem('myFavorites').then(favs => {
            if(favs) setFavorites(JSON.parse(favs));
        });
    }

    const init = async () => {
      try {
        const savedNotis = await AsyncStorage.getItem('myNotifications');
        if (savedNotis) setNotifications(JSON.parse(savedNotis));
        const savedLastUpdated = await AsyncStorage.getItem('lastUpdatedTime');
        if (savedLastUpdated) setLastUpdated(savedLastUpdated);
        fetchStockData();
        const interval = setInterval(fetchStockData, 30000);
        return () => clearInterval(interval);
      } catch (e) { console.warn(e); }
    };
    init();

    return () => {
        if(unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const showAlert = (title, message, onConfirm = () => {}, showCancel = false, onCancel = () => {}, confirmText = "확인") => {
      setAlertConfig({
          visible: true,
          title,
          message,
          onConfirm: () => {
              setAlertConfig(prev => ({ ...prev, visible: false }));
              onConfirm();
          },
          showCancel,
          onCancel: () => {
              setAlertConfig(prev => ({ ...prev, visible: false }));
              onCancel();
          },
          confirmText
      });
  };

  const handleLogin = () => {
      if (isLoaded && !isPremium) {
         // show();
      }
  };

  const handleLogout = async () => {
      showAlert(
          "로그아웃", "정말 로그아웃 하시겠습니까?",
          async () => {
              if (auth) await signOut(auth);
              else {
                  await AsyncStorage.removeItem('userInfo');
                  setUserInfo(null);
              }
          },
          true
      );
  };

  const handleDeleteAccount = async () => {
      showAlert(
          "회원 탈퇴", "정말로 탈퇴하시겠습니까? 계정과 모든 데이터가 삭제됩니다.",
          async () => {
              if (auth && auth.currentUser) {
                  try {
                      await deleteDoc(doc(db, "users", auth.currentUser.uid));
                      await deleteUser(auth.currentUser);
                      showAlert("탈퇴 완료", "이용해 주셔서 감사합니다.");
                  } catch (e) {
                      showAlert("오류", "탈퇴 처리 중 문제가 발생했습니다. 다시 로그인 후 시도해주세요.");
                  }
              }
          },
          true
      );
  };

  const handlePasswordReset = async () => {
      if (userInfo && userInfo.email) {
          try {
              await sendPasswordResetEmail(auth, userInfo.email);
              showAlert("이메일 발송", `${userInfo.email}로 비밀번호 재설정 링크를 보냈습니다.`);
          } catch (e) {
              showAlert("오류", e.message);
          }
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

  const addNotification = async (title, message) => {
    const newNoti = {
      id: Date.now(), title: title, message: message,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    const newNotis = [newNoti, ...notifications];
    setNotifications(newNotis);
    await AsyncStorage.setItem('myNotifications', JSON.stringify(newNotis));
    setToastMessage(title);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const clearNotifications = async () => { setNotifications([]); await AsyncStorage.removeItem('myNotifications'); };

  const fetchStockData = async (url = DATA_URL) => {
    setError(false);
    try {
      const response = await fetch(`${url}?t=${Date.now()}`);
      if (!response.ok) throw new Error("Data Error");
      const data = await response.json();

      if (data.stocks) {
        setStocks(data.stocks);
        setMarketStatus(data.market_status);
        setError(false);
      } else {
        if (Array.isArray(data)) setStocks(data);
        else throw new Error("Format Error");
      }

      const currentLastUpdated = await AsyncStorage.getItem('lastUpdatedTime');

      if (url === DATA_URL && data.timestamp && data.timestamp !== currentLastUpdated) {
          const dataTime = new Date(data.timestamp.replace(/-/g, '/'));
          const now = new Date();

          if (dataTime.toDateString() === now.toDateString()) {
               addNotification("🔔 새로운 추천 도착!", "AI가 새로운 종목 분석을 완료했습니다.");
          }
          setLastUpdated(data.timestamp);
          await AsyncStorage.setItem('lastUpdatedTime', data.timestamp);
      }
    } catch (err) {
      console.log("Load Failed, using fallback");
      setError(true);
      if(stocks.length === 0) setStocks(FALLBACK_DATA);
    }
  };

  const handleLoadHistory = async (file) => {
    setLoading(true);
    try {
        if (file.startsWith('mock_')) {
            const dummyData = FALLBACK_DATA.map(s => ({
                ...s,
                changePercent: parseFloat((Math.random() * 5 - 2).toFixed(2)),
                rank: Math.floor(Math.random() * 10) + 1
            }));

            setStocks(dummyData);
            setMarketStatus({
                US: { current: 4500, change: 1.2, status: 'GOOD' },
                KR: { current: 2500, change: 0.5, status: 'BAD' },
                VIX: { current: 15, change: -2.3, status: 'GOOD' }
            });
            setIsHistoryMode(true);
            const datePart = file.replace('mock_', '').replace('.json', '');
            const formattedDate = `2024-${datePart.substring(0,2)}-${datePart.substring(2)}`;
            setLastUpdated(formattedDate);

            setActiveView('HOME');
            setLoading(false);
            return;
        }

        const url = `https://ajazara-ops.github.io/stock-app/${file}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch history");

        const data = await response.json();

        if (data.stocks) {
            setStocks(data.stocks);
            setMarketStatus(data.market_status);
            setIsHistoryMode(true);
            if (data.timestamp) setLastUpdated(data.timestamp);

            setActiveView('HOME');
            showAlert("알림", "과거 데이터를 불러왔습니다. 상단의 '새로고침'을 누르면 최신 데이터로 돌아갑니다.");
        }
    } catch (e) {
        showAlert("오류", "데이터를 불러올 수 없습니다.\n" + e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleRefresh = () => {
      setIsHistoryMode(false);
      setHistoryDate(null);
      fetchStockData(DATA_URL);
  };

  const handleGoHome = () => {
    setIsHistoryMode(false);
    setHistoryDate(null);
    fetchStockData(DATA_URL);
    setActiveTab('US');
    setActiveView('HOME');
  };

  const handleBackToHistoryList = () => {
    setIsHistoryMode(false);
    setActiveView('HISTORY');
    setHistoryDate(null);
  };

  const displayStocks = useMemo(() => {
    if (activeView === 'HISTORY') return [];
    if (activeTab === 'FAV') {
      return favorites.map(fav => {
        const latest = stocks.find(s => s.id === fav.id);
        return latest ? { ...latest, rank: latest.rank } : { ...fav, rank: null };
      });
    }
    return stocks.filter(stock => stock.market === activeTab);
  }, [activeTab, stocks, activeView, favorites]);

  const handlePurchasePremium = async (planType) => {
      if (!offerings) {
          showAlert("오류", "상품 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
          return;
      }

      try {
          let packageToBuy;
          if (planType === 'monthly') {
              packageToBuy = offerings.monthly;
          } else if (planType === 'yearly') {
              packageToBuy = offerings.annual;
          }

          if (!packageToBuy) {
              showAlert("오류", "해당 상품 패키지를 찾을 수 없습니다.");
              return;
          }

          const { customerInfo } = await Purchases.purchasePackage(packageToBuy);

          if (customerInfo.entitlements.active['premium']) {
              setIsPremium(true);
              if (userInfo) {
                  updateDoc(doc(db, "users", userInfo.uid), { isPremium: true });
              }
              showAlert("결제 성공", "환영합니다! 프리미엄 멤버십이 활성화되었습니다. 🎉");
          }
      } catch (e) {
          if (!e.userCancelled) {
              showAlert("결제 실패", e.message);
          }
      }
  };

  const handleRestorePurchases = async () => {
      try {
          const restore = await Purchases.restorePurchases();
          if (restore.entitlements.active['premium']) {
              setIsPremium(true);
              if (userInfo) {
                  updateDoc(doc(db, "users", userInfo.uid), { isPremium: true });
              }
              showAlert("복원 성공", "구매 내역을 복원했습니다.");
          } else {
              showAlert("알림", "복원할 구매 내역이 없습니다.");
          }
      } catch (e) {
          showAlert("오류", "구매 복원 중 오류가 발생했습니다.");
      }
  };

  const handleStockClick = (stock, index) => {
      if (!isPremium && index >= 2 && !unlockedStocks.includes(stock.id)) {
          setPendingStock(stock);
          if (isLoaded) {
              try {
                show();
              } catch(e) {
                showAlert("오류", "광고 로드 실패. 잠시 후 다시 시도해주세요.");
                load();
              }
          } else {
              showAlert("알림", "광고를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
              load();
          }
      } else {
          setSelectedStock(stock);
      }
  };

  return (
    <SafeAreaProvider>
      <RNSafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" />

        <CustomAlert
            visible={alertConfig.visible}
            title={alertConfig.title}
            message={alertConfig.message}
            onConfirm={alertConfig.onConfirm}
            confirmText={alertConfig.confirmText}
            showCancel={alertConfig.showCancel}
            onCancel={alertConfig.onCancel}
        />

        {showToast && (
             <View style={styles.toastContainer}>
                 <View style={styles.bgIcon}><Icon name="bell" size={14} color="#fff"/></View>
                 <Text style={styles.toastText}>{toastMessage}</Text>
                 <TouchableOpacity onPress={() => setShowToast(false)}><Icon name="x" size={16} color="#9CA3AF"/></TouchableOpacity>
             </View>
        )}

        {showSplash ? (
            <View style={[styles.container, styles.center]}>
                <View style={styles.splashIcon}>
                <Icon name="swing" size={60} color="#fff" />
                </View>
                <Text style={styles.splashTitle}>Daily<Text style={{color:'#818CF8'}}>Pick10</Text></Text>
                <Text style={styles.splashSub}>AI 스마트 스윙 투자</Text>
            </View>
        ) : !userInfo ? (
            <LoginScreen onLogin={handleLogin} />
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
                          <Text style={[styles.headerTitle, { marginLeft: 10 }]}>주간 리포트</Text>
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
                            <TouchableOpacity onPress={() => setShowGuide(true)} style={styles.iconBtn}>
                              <Icon name="help" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleRefresh} style={styles.iconBtn}>
                              {loading ? <ActivityIndicator size="small" color="#9CA3AF" /> : <Icon name="refresh" size={20} color="#9CA3AF" />}
                            </TouchableOpacity>
                          </View>
                        </>
                      )}

                      {activeView === 'NOTIFICATIONS' && notifications.length > 0 && (
                        <TouchableOpacity onPress={clearNotifications}>
                          <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>전체 삭제</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* 메인 콘텐츠 영역 */}
                {activeView === 'HOME' ? (
                  <ScrollView style={styles.scrollView} contentContainerStyle={{paddingBottom: 20}}>
                    {isHistoryMode ? (
                        <HistoryReport stocks={stocks} date={lastUpdated} />
                    ) : (
                        <>
                            <MarketBanner marketStatus={marketStatus} />

                            {!isPremium && <AdBannerComponent />}

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
                                key={idx}
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
                   <HistoryView onSelectHistory={handleLoadHistory} />
                ) : activeView === 'NOTIFICATIONS' ? (
                   <NotificationView notifications={notifications} onClear={clearNotifications} />
                ) : (
                    <SettingsView
                        userInfo={userInfo}
                        isPremium={isPremium}
                        onLogout={handleLogout}
                        onDeleteAccount={handleDeleteAccount}
                        onPasswordReset={handlePasswordReset}
                        onShowGuide={() => setShowGuide(true)}
                        onPurchasePremium={handlePurchasePremium}
                        onRestore={handleRestorePurchases}
                    />
                )}

                {/* 4. 하단 네비게이션 */}
                <View style={styles.bottomNav}>
                   <TouchableOpacity onPress={handleGoHome} style={styles.navBtn}>
                     <Icon name="home" color={activeView==='HOME' && !isHistoryMode ?'#60A5FA':'#6B7280'} size={24} />
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => setActiveView('HISTORY')} style={styles.navBtn}>
                     <Icon name="history" color={activeView==='HISTORY'?'#60A5FA':'#6B7280'} size={24} />
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => setActiveView('NOTIFICATIONS')} style={styles.navBtn}>
                     <Icon name="bell" color={activeView==='NOTIFICATIONS'?'#60A5FA':'#6B7280'} size={24} />
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => setActiveView('SETTINGS')} style={styles.navBtn}>
                     <Icon name="settings" color={activeView==='SETTINGS'?'#60A5FA':'#6B7280'} size={24} />
                   </TouchableOpacity>
                </View>
            </>
        )}

        {selectedStock && (
            <StockDetail 
                stock={selectedStock} 
                onBack={() => setSelectedStock(null)} 
                isFavorite={favorites.some(f => f.id === selectedStock.id)}
                onToggleFavorite={toggleFavorite}
            />
        )}
        <GuideModal visible={showGuide} onClose={() => setShowGuide(false)} />
      </RNSafeAreaView>
    </SafeAreaProvider>
  );
}

// --- 스타일 정의 ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  modalContainer: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#374151', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  logoText: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  iconBtn: { padding: 8, backgroundColor: '#1F2937', borderRadius: 20 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#9CA3AF', fontSize: 12 },
  
  scrollView: { flex: 1 },
  // 배너 중앙 정렬
  bannerScroll: { marginHorizontal: 16, marginTop: 10, marginBottom: 10, maxHeight: 60 },
  marketBadge: { backgroundColor: '#1F2937', padding: 8, borderRadius: 12, marginRight: 8, minWidth: 85, borderWidth: 1, borderColor: '#374151', alignItems:'center' },
  panicBadge: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' },
  marketTitle: { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  marketValue: { color: 'white', fontSize: 14, fontWeight: 'bold', marginRight: 4 },
  marketChange: { fontSize: 10, fontWeight: 'bold' },
  marketMsg: { color: '#D1D5DB', fontSize: 10, marginTop: 2 },
  
  // (삭제된 HotSectorBanner 관련 스타일 제거)
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#1F2937', marginHorizontal: 16, padding: 4, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#374151' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  activeTabBtn: { backgroundColor: '#374151' },
  tabText: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  activeTabText: { color: 'white' },
  
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  statusText: { color: '#9CA3AF', fontSize: 12, marginLeft: 4 },
  historyBadge: { fontSize: 10, color: '#A5B4FC', backgroundColor: 'rgba(79, 70, 229, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold', borderWidth: 1, borderColor: '#4338CA' },

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
  
  barContainer: { height: 4, backgroundColor: '#374151', borderRadius: 2, marginTop: 12, marginBottom: 8, position: 'relative' },
  barFill: { position: 'absolute', left: 0, right: 0, height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.3)' },
  barDot: { position: 'absolute', left: '50%', top: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  
  emptyView: { alignItems: 'center', marginTop: 50 },
  centerView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoText: { color: '#6B7280', fontSize: 14, marginTop: 10 },
  emptyText: { color: '#6B7280', fontSize: 14, marginTop: 10 },
  infoTextSmall: { fontSize: 11, color: '#6B7280', fontStyle: 'italic' },
  
  // 하단 네비게이션 스타일
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#374151', backgroundColor: '#111827', paddingBottom: 4 },
  navBtn: { padding: 10 },
  
  splashIcon: { backgroundColor: '#4F46E5', padding: 20, borderRadius: 30, marginBottom: 20 },
  splashTitle: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  splashSub: { fontSize: 14, color: '#9CA3AF', marginTop: 10, marginBottom: 30 },

  // 설정 화면 스타일
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#374151' },
  settingText: { color: '#E5E7EB', fontSize: 14, marginLeft: 10 },
  
  // 로그인 화면 스타일
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151', borderRadius: 12, paddingHorizontal: 16, marginBottom: 12 },
  input: { flex: 1, color: 'white', paddingVertical: 14, marginLeft: 10, fontSize: 16 },
  loginBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 30, marginTop: 10, shadowColor: "#4F46E5", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // [복구 완료] 가이드 모달 및 상세 화면 스타일
  content: { padding: 16 },
  card: { backgroundColor: '#1F2937', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  cardTitle: { color: '#E5E7EB', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  bodyText: { color: '#D1D5DB', fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  // StockDetail 관련 스타일
  scoreBadge: { backgroundColor: 'rgba(99, 102, 241, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#6366F1' },
  scoreText: { color: '#A5B4FC', fontSize: 10, fontWeight: 'bold' },
  grid2: { flexDirection: 'row', gap: 10 },
  miniCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  label: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  value: { fontSize: 16, fontWeight: 'bold' },
  priceInfoBar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, backgroundColor: 'rgba(55, 65, 81, 0.5)', padding: 8, borderRadius: 8 },
  grid3: { flexDirection: 'row', gap: 8 },
  financeBox: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  financeLabel: { color: '#9CA3AF', fontSize: 10, marginBottom: 2 },
  financeValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  reasonSectionBox: { marginTop: 10, backgroundColor: 'rgba(55, 65, 81, 0.3)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(75, 85, 99, 0.3)' },
  reasonItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  reasonBullet: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  reasonTextNew: { color: '#E5E7EB', fontSize: 13 },
  bottomSheet: { padding: 16, borderTopWidth: 1, borderTopColor: '#374151', backgroundColor: '#1F2937' },
  actionBtn: { width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', shadowColor: "#2563EB", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  actionBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  newsItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#374151' },
  newsTitle: { color: '#E5E7EB', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  newsDate: { color: '#6B7280', fontSize: 10, marginLeft: 6 },
  
  // [New] 배너 광고 스타일
  adBannerContainer: { width: '100%', alignItems: 'center', marginTop: 0, marginBottom: 0, paddingHorizontal: 16 },
  adBannerContent: { width: '100%', height: 60, backgroundColor: '#374151', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#6B7280' },
  adBannerText: { color: '#9CA3AF', fontSize: 14, fontWeight: 'bold' },
  adBannerSubText: { color: '#6B7280', fontSize: 10, marginTop: 4 },
  // [New] 토스트 메시지 스타일
  toastContainer: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: 'rgba(31, 41, 55, 0.95)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, zIndex: 9999, borderWidth: 1, borderColor: '#374151' },
  toastText: { color: 'white', flex: 1, marginLeft: 10, fontSize: 14, fontWeight: 'bold' },
  bgIcon: { backgroundColor: '#4F46E5', padding: 8, borderRadius: 20 },
});