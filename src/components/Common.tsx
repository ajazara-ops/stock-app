import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Icon } from './Icons';
import { styles } from '../styles';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

export const TermItem = ({ title, desc }) => (
  <View style={{marginBottom: 12}}>
      <Text style={{color: '#93C5FD', fontWeight: 'bold', fontSize: 13}}>{title}</Text>
      <Text style={{color: '#D1D5DB', fontSize: 12, lineHeight: 18}}>{desc}</Text>
  </View>
);

export const TipItem = ({ text }) => (
  <View style={{flexDirection: 'row', marginBottom: 6}}>
      <Text style={{color: '#FBBF24', marginRight: 6}}>•</Text>
      <Text style={{color: '#D1D5DB', fontSize: 12, lineHeight: 18, flex: 1}}>{text}</Text>
  </View>
);

export const GuideModal = ({ visible, onClose }) => {
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

export const CustomAlert = ({ visible, title, message, onConfirm, confirmText = "확인", showCancel, onCancel }) => {
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

export const AdBannerComponent = ({ adUnitId }) => {
    return (
        <View style={styles.adBannerContainer}>
            <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
            />
        </View>
    );
};