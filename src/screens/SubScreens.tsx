import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { Icon } from '../components/Icons';
import { styles } from '../styles';
import { useInterstitialAd } from 'react-native-google-mobile-ads';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import * as Google from 'expo-auth-session/providers/google';
// import * as WebBrowser from 'expo-web-browser'; // 웹브라우저 미사용으로 주석 처리

// --- [약관 내용 상수 (표준 양식 적용)] ---
const TERMS_CONTENT = `
제1조 (목적)
본 약관은 DailyPick10(이하 "회사")이 제공하는 주식 정보 서비스(이하 "서비스")의 이용조건 및 절차, 이용자와 회사의 권리, 의무, 책임사항을 규정함을 목적으로 합니다.

제2조 (면책조항)
1. 본 서비스에서 제공하는 모든 주식 정보, AI 분석 점수, 추천 종목 등은 투자 참고용 자료이며, 투자의 최종 책임은 이용자 본인에게 있습니다.
2. 회사는 서비스 이용으로 인해 발생한 투자 손실에 대해 법적 책임을 지지 않습니다.
3. 천재지변 또는 이에 준하는 불가항력으로 인해 서비스를 제공할 수 없는 경우 회사는 책임이 면제됩니다.

제3조 (서비스 이용 및 변경)
1. 회원은 회사가 정한 가입 양식에 따라 정보를 기입한 후 본 약관에 동의함으로써 회원가입을 신청합니다.
2. 회사는 운영상, 기술상의 필요에 따라 제공하고 있는 서비스의 전부 또는 일부를 수정, 중단, 변경할 수 있습니다.

제4조 (회원의 의무)
1. 회원은 관계 법령, 본 약관의 규정, 이용안내 등을 준수해야 합니다.
2. 회원은 서비스 이용 권한을 타인에게 양도, 증여할 수 없습니다.
3. 서비스 내의 데이터를 무단으로 수집하거나 상업적으로 이용하는 행위를 금지합니다.

제5조 (유료 서비스)
1. 프리미엄 멤버십은 구글 플레이 스토어 또는 애플 앱스토어의 인앱 결제 정책을 따릅니다.
2. 환불 및 결제 취소는 해당 스토어의 규정에 따릅니다.

제6조 (준거법 및 관할)
본 약관은 대한민국 법률에 따라 규율되며, 서비스와 관련하여 발생한 분쟁은 회사의 본점 소재지를 관할하는 법원을 전속 관할로 합니다.

(시행일) 본 약관은 2024년 1월 1일부터 시행합니다.
`;

const PRIVACY_CONTENT = `
1. 개인정보의 수집 및 이용 목적
회사는 회원가입, 원활한 고객상담, 서비스 제공을 위해 최소한의 개인정보를 수집하고 있습니다.
- 회원 식별 및 가입 의사 확인
- 유료 서비스 제공 및 결제 내역 관리
- 서비스 이용 기록 분석을 통한 품질 개선

2. 수집하는 개인정보의 항목
- 필수항목: 이메일 주소, 비밀번호(암호화 저장), 로그인 ID(UID)
- 선택항목: 광고 식별자(ADID/IDFA)
- 자동수집: 접속 로그, 쿠키, 기기 정보

3. 개인정보의 제3자 제공 및 위탁
회사는 원칙적으로 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 서비스 제공을 위해 아래와 같은 외부 전문 업체에 위탁하여 운영하고 있습니다.
- Google Firebase: 회원 인증, 데이터 저장, 푸시 알림 발송
- Google AdMob: 맞춤형 광고 제공
- RevenueCat: 인앱 결제 관리

4. 개인정보의 보유 및 이용 기간
회원 탈퇴 시 수집된 개인정보는 지체 없이 파기합니다. 단, 관계 법령에 의하여 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.
- 소비자의 불만 또는 분쟁처리에 관한 기록: 3년

5. 이용자의 권리
이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보 이용 동의를 철회할 수 있습니다. 설정 메뉴의 '회원 탈퇴' 기능을 이용하거나 고객센터로 요청하시면 즉시 조치됩니다.

6. 개인정보 보호책임자 및 문의
서비스 이용 중 발생하는 모든 개인정보보호 관련 민원은 아래의 이메일로 신고하실 수 있습니다.
- 이메일: dailypick10.help@gmail.com (임시)

(시행일) 본 방침은 2024년 1월 1일부터 시행합니다.
`;

// --- [약관 모달 컴포넌트] ---
const TermsModal = ({ visible, title, content, onClose }) => {
    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center'}}>
                <View style={{width: '90%', height: '80%', backgroundColor: '#1F2937', borderRadius: 20, overflow: 'hidden'}}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                            <Icon name="x" color="#E5E7EB" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{padding: 20}}>
                        <Text style={{color: '#D1D5DB', lineHeight: 24, fontSize: 14}}>{content}</Text>
                        <View style={{height: 50}} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// ---------------- LoginScreen ----------------
export const LoginScreen = ({ onLogin, adUnitId }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [loading, setLoading] = useState(false);

    // 약관 모달 상태
    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', content: '' });

    const openTerms = (type) => {
        if (type === 'terms') {
            setModalContent({ title: '이용약관', content: TERMS_CONTENT });
        } else {
            setModalContent({ title: '개인정보 처리방침', content: PRIVACY_CONTENT });
        }
        setModalVisible(true);
    };

    // 구글 로그인 요청 Hook
    // ⚠️ [중요] 실제 앱 배포 시에는 Google Cloud Console에서 발급받은 Client ID를 아래에 입력해야 합니다.
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        // 예: '123456789-abcdefg.apps.googleusercontent.com'
        clientId: 'YOUR_WEB_CLIENT_ID', 
        androidClientId: 'YOUR_ANDROID_CLIENT_ID',
        iosClientId: 'YOUR_IOS_CLIENT_ID',
    });

    // 구글 로그인 응답 처리
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            setLoading(true);
            signInWithCredential(auth, credential)
                .then(() => {
                    // 로그인 성공 시 onAuthStateChanged가 처리하므로 별도 로직 불필요
                })
                .catch((error) => {
                    Alert.alert("구글 로그인 오류", error.message);
                    setLoading(false);
                });
        }
    }, [response]);

    // 전면 광고 Hook
    const { isLoaded, load, show, isClosed } = useInterstitialAd(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
    });

    useEffect(() => {
        load();
    }, [load]);

    // 광고가 닫히면 로그인 완료 처리
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

    // 비밀번호 재설정 함수
    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert("알림", "비밀번호 재설정 링크를 받으려면 이메일을 입력해주세요.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert("이메일 발송", `${email}로 비밀번호 재설정 링크를 보냈습니다. 이메일을 확인해주세요.`);
        } catch (error) {
            let msg = error.message;
            if (error.code === 'auth/user-not-found') msg = "등록되지 않은 이메일입니다.";
            if (error.code === 'auth/invalid-email') msg = "이메일 형식이 올바르지 않습니다.";
            Alert.alert("오류", msg);
        }
    };

    return (
        <View style={[styles.container, styles.center, {padding: 40}]}>
            <TermsModal 
                visible={modalVisible} 
                title={modalContent.title} 
                content={modalContent.content} 
                onClose={() => setModalVisible(false)} 
            />

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

                {/* 비밀번호 재설정 버튼 (로그인 모드일 때만 표시) */}
                {!isSignup && (
                    <TouchableOpacity onPress={handleForgotPassword} style={{alignSelf: 'flex-end', marginBottom: 5}}>
                        <Text style={{color: '#9CA3AF', fontSize: 12, textDecorationLine: 'underline'}}>비밀번호 재설정</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={handleSubmit} style={styles.loginBtn} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginBtnText}>{isSignup ? "회원가입" : "로그인"}</Text>}
                </TouchableOpacity>

                {/* 구글 로그인 버튼 추가 */}
                <Text style={[styles.orText, { marginVertical: 10 }]}>또는</Text>
                
                <TouchableOpacity 
                    onPress={() => promptAsync()} 
                    style={[styles.googleBtn, { marginTop: 0 }]} 
                    disabled={!request || loading}
                >
                    {/* 구글 로고 아이콘 대신 G 텍스트로 대체 (SVG 아이콘 추가 가능) */}
                    <Text style={{color: '#EA4335', fontWeight:'bold', fontSize:18, marginRight: 10}}>G</Text>
                    <Text style={styles.googleBtnText}>Google로 계속하기</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsSignup(!isSignup)} style={{marginTop: 20, padding: 10}}>
                    <Text style={{color: '#60A5FA', textAlign: 'center'}}>
                        {isSignup ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
                    </Text>
                </TouchableOpacity>

                {/* [New] 이용약관 및 개인정보 처리방침 링크 (모달로 연결) */}
                <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 30, gap: 20}}>
                    <TouchableOpacity onPress={() => openTerms('terms')}>
                        <Text style={{color: '#6B7280', fontSize: 11, textDecorationLine: 'underline'}}>이용약관</Text>
                    </TouchableOpacity>
                    <View style={{width: 1, height: 12, backgroundColor: '#4B5563'}} />
                    <TouchableOpacity onPress={() => openTerms('privacy')}>
                        <Text style={{color: '#6B7280', fontSize: 11, textDecorationLine: 'underline'}}>개인정보 처리방침</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// ---------------- NotificationView ----------------
export const NotificationView = ({ notifications }) => { // [수정] onClear prop 제거 (헤더 버튼 사용)
    return (
        <View style={{flex: 1, backgroundColor: '#111827'}}>
            {/* [수정] 상단 중복 전체삭제 버튼 제거 */}
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

// ---------------- HistoryView ----------------
export const HistoryView = ({ onSelectHistory }) => {
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchHistoryIndex = async () => {
            setLoading(true);
            try {
                const res = await fetch(`https://ajazara-ops.github.io/dailypick10/history_index.json?t=${Date.now()}`, {
                    cache: "no-store", headers: { 'Cache-Control': 'no-cache' }
                });

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
                    d.setDate(d.getDate() + 1);
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

// ---------------- SettingsView ----------------
export const SettingsView = ({ userInfo, isPremium, onLogout, onDeleteAccount, onPasswordReset, onShowGuide, onPurchasePremium, onRestore, onShareApp }) => { // [수정] onShareApp prop 추가
    const [selectedPlan, setSelectedPlan] = useState('monthly');

    // 약관 모달 상태
    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', content: '' });

    const openTerms = (type) => {
        if (type === 'terms') {
            setModalContent({ title: '이용약관', content: TERMS_CONTENT });
        } else {
            setModalContent({ title: '개인정보 처리방침', content: PRIVACY_CONTENT });
        }
        setModalVisible(true);
    };

    return (
        <View style={{flex: 1, backgroundColor: '#111827'}}>
            <TermsModal 
                visible={modalVisible} 
                title={modalContent.title} 
                content={modalContent.content} 
                onClose={() => setModalVisible(false)} 
            />

            <ScrollView style={styles.content}>
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

                {!isPremium && (
                    <View style={[styles.card, {backgroundColor: 'rgba(79, 70, 229, 0.1)', borderColor: '#6366F1', borderWidth: 1}]}>
                         <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                             <Icon name="crown" size={20} color="#FBBF24" />
                             <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8}}>프리미엄 멤버십</Text>
                         </View>

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
                             <TouchableOpacity onPress={onRestore} style={{marginTop: 15, alignItems: 'center'}}>
                                 <Text style={{color: '#9CA3AF', fontSize: 12, textDecorationLine: 'underline'}}>
                                     이미 구매하셨나요? 구매 내역 복원하기
                                 </Text>
                             </TouchableOpacity>
                    </View>
                )}

                <Text style={{color: '#6B7280', fontSize: 12, marginLeft: 4, marginBottom: 8, marginTop: 10}}>계정 관리</Text>
                
                {/* [New] 친구에게 추천하기 버튼 (앱 정보 위에 배치) */}
                <TouchableOpacity onPress={onShareApp} style={styles.settingItem}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name="share" size={20} color="#818CF8" />
                        <Text style={[styles.settingText, {color: '#818CF8', fontWeight:'bold'}]}>친구에게 추천하기</Text>
                    </View>
                    <Icon name="arrowRight" size={16} color="#4B5563" />
                </TouchableOpacity>

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
                
                <TouchableOpacity onPress={() => openTerms('terms')} style={styles.settingItem}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name="shield" size={20} color="#9CA3AF" />
                        <Text style={styles.settingText}>이용약관</Text>
                    </View>
                    <Icon name="arrowRight" size={16} color="#4B5563" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => openTerms('privacy')} style={styles.settingItem}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name="lock" size={20} color="#9CA3AF" />
                        <Text style={styles.settingText}>개인정보 처리방침</Text>
                    </View>
                    <Icon name="arrowRight" size={16} color="#4B5563" />
                </TouchableOpacity>

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