import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
  bannerScroll: { marginHorizontal: 16, marginTop: 10, marginBottom: 10, maxHeight: 60 },
  
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
  
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#374151', backgroundColor: '#111827', paddingBottom: 4 },
  navBtn: { padding: 10 },
  
  splashIcon: { backgroundColor: '#4F46E5', padding: 20, borderRadius: 30, marginBottom: 20 },
  splashTitle: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  splashSub: { fontSize: 14, color: '#9CA3AF', marginTop: 10, marginBottom: 30 },

  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#374151' },
  settingText: { color: '#E5E7EB', fontSize: 14, marginLeft: 10 },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151', borderRadius: 12, paddingHorizontal: 16, marginBottom: 12 },
  input: { flex: 1, color: 'white', paddingVertical: 14, marginLeft: 10, fontSize: 16 },
  
  loginBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 30, marginTop: 10, shadowColor: "#4F46E5", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // [New] 구글 로그인 버튼 스타일
  googleBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', paddingVertical: 14, borderRadius: 30, marginTop: 12, shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  googleBtnText: { color: '#374151', fontSize: 16, fontWeight: 'bold' },
  orText: { color: '#6B7280', textAlign: 'center', marginVertical: 16, fontSize: 12 },

  content: { padding: 16 },
  card: { backgroundColor: '#1F2937', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  cardTitle: { color: '#E5E7EB', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  bodyText: { color: '#D1D5DB', fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
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
  
  adBannerContainer: { width: '100%', alignItems: 'center', marginTop: 0, marginBottom: 0, paddingHorizontal: 16 },
  adBannerContent: { width: '100%', height: 60, backgroundColor: '#374151', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#6B7280' },
  adBannerText: { color: '#9CA3AF', fontSize: 14, fontWeight: 'bold' },
  adBannerSubText: { color: '#6B7280', fontSize: 10, marginTop: 4 },
  toastContainer: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: 'rgba(31, 41, 55, 0.95)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, zIndex: 9999, borderWidth: 1, borderColor: '#374151' },
  toastText: { color: 'white', flex: 1, marginLeft: 10, fontSize: 14, fontWeight: 'bold' },
  bgIcon: { backgroundColor: '#4F46E5', padding: 8, borderRadius: 20 },
  notiCard: { flexDirection: 'row', backgroundColor: '#1F2937', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#374151' },
  notiIcon: { marginRight: 12, marginTop: 2 },
  notiTitle: { color: 'white', fontWeight: 'bold', marginBottom: 2 },
  notiMsg: { color: '#9CA3AF', fontSize: 12, marginBottom: 4 },
  notiTime: { color: '#6B7280', fontSize: 10 },
});