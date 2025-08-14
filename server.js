// server.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

app.use(express.static('public'));

const coins = ['bitcoin','ethereum','dogecoin'];
const blockchair = {
  bitcoin: 'https://api.blockchair.com/bitcoin/stats',
  ethereum: 'https://api.blockchair.com/ethereum/stats',
  dogecoin: 'https://api.blockchair.com/dogecoin/stats'
};

app.get('/api/data', async (req,res)=>{
  try{
    const coinData = await Promise.all(coins.map(async id=>{
      try{
        const r = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
        const js = await r.json();
        const md = js.market_data || {};
        return {
          id,
          price: md.current_price?.usd || null,
          market_cap: md.market_cap?.usd || null,
          volume: md.total_volume?.usd || null,
          change24: md.price_change_percentage_24h || null
        }
      }catch(e){ return {id,error:true}; }
    }));

    const onchainData = await Promise.all(coins.map(async id=>{
      try{
        if(!blockchair[id]) return {id, note:'Blockchair ندارد'};
        const r = await fetch(blockchair[id]);
        const js = await r.json();
        const s = js.data || js;
        const fields = ['blocks','transactions','unique_addresses','active_addresses','outputs_total','new_addresses','large_transactions'];
        const filtered = {};
        fields.forEach(f=>{if(s[f]!==undefined) filtered[f]=s[f];});
        return {id, stats:filtered};
      }catch(e){ return {id,error:true}; }
    }));

    res.json({coins:coinData,onchain:onchainData});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'خطا در دریافت داده‌ها'});
  }
});

app.listen(port, ()=>console.log(`Server running on http://localhost:${port}`));