import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Platform, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { TestIds, useInterstitialAd } from 'react-native-google-mobile-ads';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import { onAuthStateChanged, signOut, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';

// --- 분리된 컴포넌트 import ---
import { auth, db } from '../src/firebaseConfig';
import { styles } from '../src/styles';
import { Icon } from '../src/components/Icons';
import { GuideModal, CustomAlert, AdBannerComponent } from '../src/components/Common';
import { MarketBanner, StockCard, StockDetail, HistoryReport } from '../src/components/StockComponents';
import { LoginScreen, NotificationView, HistoryView, SettingsView } from '../src/screens/SubScreens';

WebBrowser.maybeCompleteAuthSession();

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DATA_URL = "https://ajazara-ops.github.io/stock-app/todays_recommendation.json";
const REVENUECAT_API_KEY = "goog_MKfuRHbmvkzalvwQiaDDxplmIff";

// [광고 ID 설정]
const adUnitIdBanner = __DEV__ ? TestIds.BANNER : 'ca-app-pub-7936612612148990/7265446537';
const adUnitIdInterstitial = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-7936612612148990/2783082527';

const FALLBACK_DATA = [
  { id: 'us1', rank: 1, symbol: 'PLTR', name: 'Palantir', market: 'US', currentPrice: 22.5, changePercent: 1.2, buyZoneTop: 23, buyZoneBottom: 21, targetPrice: 28, aiReason: 'RSI 과매도 + 골든크로스 + 매출 고성장', history: [], score: 85, rsi: 32, news: [], rvol: 2.5, sector: "Technology", financials: { op_margin: 0.2, rev_growth: 0.15, per: 45 } },
  { id: 'kr1', rank: 1, symbol: '005930', name: '삼성전자', market: 'KR', currentPrice: 72500, changePercent: -0.5, buyZoneTop: 73000, buyZoneBottom: 71000, targetPrice: 80000, aiReason: '외국인 수급 유입 + 60일선 지지', history: [], score: 75, rsi: 45, news: [], rvol: 1.2, sector: "Technology", financials: { op_margin: 0.1, rev_growth: -0.05, per: 12 } }
];

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

  // 커스텀 알림 상태
  const [alertConfig, setAlertConfig] = useState({
      visible: false, title: "", message: "", onConfirm: () => {}, confirmText: "확인", showCancel: false, onCancel: () => {},
  });

  // 전면 광고 Hook
  const { isLoaded, isClosed, load, show } = useInterstitialAd(adUnitIdInterstitial, {
      requestNonPersonalizedAdsOnly: true,
  });

  // 뒤로가기 핸들러 추가
  useEffect(() => {
    const backAction = () => {
      if (selectedStock) { setSelectedStock(null); return true; }
      if (showGuide) { setShowGuide(false); return true; }
      if (activeView !== 'HOME') {
        setActiveView('HOME');
        if (isHistoryMode) { setIsHistoryMode(false); setHistoryDate(null); fetchStockData(DATA_URL); }
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedStock, activeView, showGuide, isHistoryMode]);

  // RevenueCat 초기화
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

  // 광고 로드 및 닫힘 처리
  useEffect(() => { try { load(); } catch (e) { console.log("Ad load error:", e); } }, [load, isClosed]);

  useEffect(() => {
    if (!showSplash && userInfo && !isPremium && !hasShownInitialAd && isLoaded) {
        try { show(); setHasShownInitialAd(true); } catch (e) { console.log("Ad show error:", e); }
    }
  }, [showSplash, userInfo, isPremium, hasShownInitialAd, isLoaded]);

  useEffect(() => {
      if (isClosed && pendingStock) {
          setUnlockedStocks(prev => [...prev, pendingStock.id]);
          setSelectedStock(pendingStock);
          setPendingStock(null);
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
        if (savedNotis) setNotifications(JSON.parse(savedNotis));
        const savedLastUpdated = await AsyncStorage.getItem('lastUpdatedTime');
        if (savedLastUpdated) setLastUpdated(savedLastUpdated);
        fetchStockData();
        const interval = setInterval(fetchStockData, 30000);
        return () => clearInterval(interval);
      } catch (e) { console.warn(e); }
    };
    init();
    return () => { if(unsubscribeAuth) unsubscribeAuth(); };
  }, []);

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

  const addNotification = async (title, message) => {
    const newNoti = { id: Date.now(), title: title, message: message, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) };
    const newNotis = [newNoti, ...notifications];
    setNotifications(newNotis);
    await AsyncStorage.setItem('myNotifications', JSON.stringify(newNotis));
    setToastMessage(title); setShowToast(true); setTimeout(() => setShowToast(false), 3000);
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
          if (dataTime.toDateString() === now.toDateString()) { addNotification("🔔 새로운 추천 도착!", "AI가 새로운 종목 분석을 완료했습니다."); }
          setLastUpdated(data.timestamp); await AsyncStorage.setItem('lastUpdatedTime', data.timestamp);
      }
    } catch (err) {
      console.log("Load Failed, using fallback"); setError(true);
      if(stocks.length === 0) setStocks(FALLBACK_DATA);
    }
  };

  const handleLoadHistory = async (file) => {
    setLoading(true);
    try {
        if (file.startsWith('mock_')) {
            const dummyData = FALLBACK_DATA.map(s => ({ ...s, changePercent: parseFloat((Math.random() * 5 - 2).toFixed(2)), rank: Math.floor(Math.random() * 10) + 1 }));
            setStocks(dummyData); setMarketStatus({ US: { current: 4500, change: 1.2, status: 'GOOD' }, KR: { current: 2500, change: 0.5, status: 'BAD' }, VIX: { current: 15, change: -2.3, status: 'GOOD' } });
            setIsHistoryMode(true);
            const datePart = file.replace('mock_', '').replace('.json', '');
            setLastUpdated(`2024-${datePart.substring(0,2)}-${datePart.substring(2)}`);
            setActiveView('HOME'); setLoading(false);
            return;
        }
        const url = `https://ajazara-ops.github.io/stock-app/${file}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch history");
        const data = await response.json();
        if (data.stocks) {
            setStocks(data.stocks); setMarketStatus(data.market_status); setIsHistoryMode(true);
            if (data.timestamp) setLastUpdated(data.timestamp);
            setActiveView('HOME'); showAlert("알림", "과거 데이터를 불러왔습니다. 상단의 '새로고침'을 누르면 최신 데이터로 돌아갑니다.");
        }
    } catch (e) { showAlert("오류", "데이터를 불러올 수 없습니다.\n" + e.message); } finally { setLoading(false); }
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
                                <StockCard key={idx} stock={stock} isFavorite={favorites.some(f => f.id === stock.id)} isLocked={!isPremium && idx >= 2 && !unlockedStocks.includes(stock.id)} onClick={() => handleStockClick(stock, idx)} onUnlock={() => handleStockClick(stock, idx)} />
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
                    <SettingsView userInfo={userInfo} isPremium={isPremium} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} onPasswordReset={handlePasswordReset} onShowGuide={() => setShowGuide(true)} onPurchasePremium={handlePurchasePremium} onRestore={handleRestorePurchases} />
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