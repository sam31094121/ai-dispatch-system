export const dispatchService = {
  async generate(reportDate: string) {
    return {
      reportDate,
      groups: {
        A1: [
          { rankNo: 1, employeeName: '李玲玲', groupOrderNo: 1, suggestionText: '收割昨日主力大單', pressureText: '-', motivationText: '維持冠軍氣勢' }
        ],
        A2: [
          { rankNo: 2, employeeName: '王大明', groupOrderNo: 1, suggestionText: '續約舊客戶穩拿', pressureText: '注意月底缺口', motivationText: '再一單上六萬' }
        ],
        B: [],
        C: [],
      }
    };
  }
};
