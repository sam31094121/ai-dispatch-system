const http = require('http');
const text = `??【AI 派單公告｜4/6 結算 → 4/7 派單順序】
一、審計結論
審計結果：PASS
【天地盤】PASS
【邏輯盤】PASS
【累積盤】PASS
本次三平台報表已重新核對完成：
奕心：正確
民視：正確
公司產品：正確
二、整合總盤（本日）
三平台整合：
【累積總通數】189
【派單成交總通數】108
【追續成交總通數】58
【追續單金額】856,816
【今日取消退貨】0
【當月總業績（扣退貨）】1,516,734
三、今日整合名次
1、馬秋香｜【追續】7｜【續單】151,240｜【總業績】233,590
2、王梅慧｜【追續】9｜【續單】127,280｜【總業績】187,660
3、林沛昕｜【追續】4｜【續單】159,320｜【總業績】174,860
4、王珍珠｜【追續】7｜【續單】127,060｜【總業績】148,108
5、李玲玲｜【追續】2｜【續單】73,860｜【總業績】125,420
6、林宜靜｜【追續】4｜【續單】26,400｜【總業績】115,020
7、廖姿惠｜【追續】4｜【續單】18,948｜【總業績】99,968
8、湯玉琦｜【追續】7｜【續單】49,680｜【總業績】97,200
9、徐華妤｜【追續】4｜【續單】63,020｜【總業績】82,020
10、江麗勉｜【追續】0｜【續單】0｜【總業績】63,220
11、梁依萍｜【追續】2｜【續單】8,180｜【總業績】35,800
12、陳玲華｜【追續】0｜【續單】0｜【總業績】31,840
13、許喬恩｜【追續】2｜【續單】27,000｜【總業績】27,000
14、蘇淑玲｜【追續】1｜【續單】5,000｜【總業績】19,280
15、鄭珮恩｜【追續】2｜【續單】2,300｜【總業績】19,180
16、高如郁｜【追續】0｜【續單】0｜【總業績】15,540
17、高美雲｜【追續】0｜【續單】0｜【總業績】12,540
18、謝啟芳｜【追續】0｜【續單】0｜【總業績】10,960
19、周美蓁｜【追續】1｜【續單】10,000｜【總業績】10,000
20、林佩君｜【追續】1｜【續單】6,528｜【總業績】6,528
21、江沛林｜【追續】1｜【續單】1,000｜【總業績】1,000
22、鄭上官｜【追續】0｜【續單】0｜【總業績】0
`;

const postData = JSON.stringify({
  operator: 'ADMIN-CORE',
  rawText: text
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/save',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    const result = JSON.parse(body);
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    if (result.data?.status) console.log('Final Snapshot Status:', result.data.status);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});

req.write(postData);
req.end();
