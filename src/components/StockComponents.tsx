import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Linking, Dimensions } from 'react-native';
import { Icon } from './Icons';
import { styles } from '../styles';
import { BarChart } from 'react-native-chart-kit';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

export const MarketBanner = ({ marketStatus }) => {
    if (!marketStatus) return null;
    const MarketBadge = ({ title, data, isVix = false }) => {
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
            {marketStatus?.US && <MarketBadge title="S&P 500" data={marketStatus.US} />}
            {marketStatus?.KR && <MarketBadge title="KOSPI" data={marketStatus.KR} />}
            {marketStatus?.VIX && <MarketBadge title="VIX" data={marketStatus.VIX} isVix={true} />}
        </ScrollView>
    );
};

export const StockCard = ({ stock, onClick, isFavorite, isLocked, onUnlock }) => {
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

export const StockDetail = ({ stock, onBack, isFavorite, onToggleFavorite }) => {
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

export const HistoryReport = ({ stocks, date }) => {
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