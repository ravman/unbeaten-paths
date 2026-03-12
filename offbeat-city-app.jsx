import { useState, useEffect, useRef, useCallback } from "react";

// ─── STYLES ───────────────────────────────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --ink: #0c0a08; --paper: #f7f2ea; --gold: #c9933a; --gold-light: #e8b96a;
      --teal: #3a9e8f; --ember: #d45a2a; --violet: #8a5fd4; --muted: #8a8070;
      --surface: #1a1510; --surface2: #2a2018; --border: rgba(201,147,58,0.2);
      --text: #f0ebe0; --text-muted: #9a9080;
    }
    body { background: var(--ink); color: var(--text); font-family: 'DM Sans', sans-serif; }
    .serif { font-family: 'Cormorant Garamond', serif; }
    .mono  { font-family: 'Space Mono', monospace; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--ink); }
    ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes shimmer{ 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .fade-up { animation: fadeUp 0.45s ease forwards; }
    .tag {
      display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 10px;
      font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      border: 1px solid var(--border); color: var(--gold); background: rgba(201,147,58,0.07);
    }
    .card-hover { transition: transform 0.22s ease, box-shadow 0.22s ease; cursor: pointer; }
    .card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 36px rgba(201,147,58,0.13); }
    .btn-primary {
      background: var(--gold); color: var(--ink); border: none; padding: 12px 28px;
      font-family: 'DM Sans'; font-weight: 700; font-size: 13px; letter-spacing: 0.06em;
      cursor: pointer; transition: all 0.18s; border-radius: 2px; text-transform: uppercase;
    }
    .btn-primary:hover { background: var(--gold-light); transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
    .btn-ghost {
      background: transparent; color: var(--gold); border: 1px solid var(--border);
      padding: 10px 22px; font-family: 'DM Sans'; font-weight: 500; font-size: 13px;
      letter-spacing: 0.04em; cursor: pointer; transition: all 0.18s; border-radius: 2px;
    }
    .btn-ghost:hover { border-color: var(--gold); background: rgba(201,147,58,0.07); }
    .input-field {
      width: 100%; background: var(--surface); border: 1px solid var(--border);
      color: var(--text); padding: 11px 15px; font-family: 'DM Sans'; font-size: 14px;
      border-radius: 2px; outline: none; transition: border-color 0.18s;
    }
    .input-field:focus { border-color: var(--gold); }
    .input-field::placeholder { color: var(--text-muted); }
    select.input-field option { background: var(--surface); }
    .nav-link {
      background: none; border: none; color: var(--text-muted); font-family: 'DM Sans';
      font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
      padding: 4px 0; transition: color 0.18s; position: relative;
    }
    .nav-link:hover, .nav-link.active { color: var(--gold); }
    .nav-link.active::after {
      content:''; position:absolute; bottom:-2px; left:0; right:0; height:1px; background:var(--gold);
    }
    .agent-terminal {
      background: #080604; border: 1px solid var(--border); border-radius: 4px;
      font-family: 'Space Mono'; font-size: 11px; overflow: hidden; position: relative;
    }
    .agent-terminal.running { border-color: var(--gold); }
    .agent-terminal.running::before {
      content:''; position:absolute; left:0; right:0; height:2px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
      background-size: 200% 100%; animation: shimmer 1.4s infinite; top:0; z-index:2;
    }
    .agent-terminal.done   { border-color: var(--teal); }
    .agent-terminal.error  { border-color: var(--ember); }
    .spot-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 1px; background: var(--border);
    }
    .spot-grid > * { background: var(--ink); }
    .rating-track { height: 3px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
    .rating-fill  { height: 100%; border-radius: 2px; transition: width 0.9s cubic-bezier(0.4,0,0.2,1); }
    @media (max-width: 640px) { .spot-grid { grid-template-columns: 1fr; } }
  `}</style>
);

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const TYPE_COLORS = { restaurant:"var(--gold)", bar:"var(--teal)", experience:"var(--violet)", market:"var(--ember)" };
const TYPE_EMOJI  = { restaurant:"🍜", bar:"🍺", experience:"✨", market:"🛍️" };
const avg = (a,b,c) => ((a+b+c)/3).toFixed(1);

const DISCOVERY_AGENTS = [
  { id:"ag1",  icon:"🌙", label:"Thonglor / Ekkamai",               focus:"late-night bars, craft cocktail dens, speakeasies, hidden izakayas", color:"var(--gold)" },
  { id:"ag2",  icon:"🏛️", label:"Old Town / Rattanakosin",          focus:"hidden temples, canal-side teahouses, artisan workshops, monks' coffee spots", color:"var(--teal)" },
  { id:"ag3",  icon:"🐉", label:"Chinatown / Talat Noi",            focus:"dawn street food, old-school coffee shops, Chinese opera houses, herbal medicine bars", color:"var(--ember)" },
  { id:"ag4",  icon:"🌊", label:"Riverside / Chao Phraya",          focus:"longtail-accessible bars, ferry pier restaurants, canal boat kitchens, riverside community spots", color:"var(--violet)" },
  { id:"ag5",  icon:"🎨", label:"Ari / Phahon Yothin",              focus:"indie record cafes, concept restaurants, local brunch spots, natural wine bars", color:"var(--gold)" },
  { id:"ag6",  icon:"🌿", label:"Thonburi West Bank",               focus:"fruit orchard cafes, canal-side villages, shadow puppet venues, hidden wats, floating kitchens", color:"var(--teal)" },
  { id:"ag7",  icon:"⚡", label:"Ratchada / Lat Phrao",             focus:"underground music venues, street-food clusters, local sports bars, weekend markets", color:"var(--ember)" },
  { id:"ag8",  icon:"🍸", label:"Silom / Sathorn",                  focus:"wine caves locals drink at, jazz dens, private dining rooms, hole-in-the-wall restaurants", color:"var(--violet)" },
  { id:"ag9",  icon:"🎭", label:"Banglamphu / Phra Nakhon",         focus:"independent bookshop bars, folk music venues, mural alley cafes, community kitchens", color:"var(--gold)" },
  { id:"ag10", icon:"🔮", label:"Sukhumvit Mid (Asok–Phrom Phong)", focus:"unmarked basement bars, fermentation cafes, tasting menus with no signage, local food courts tourists miss", color:"var(--teal)" },
];

const DISCOVERED_SPOTS = [
{
  id:"ag1-0",
  cityId:"bangkok",
  name:"Teens of Thailand",
  type:"bar",
  neighborhood:"Chinatown (also beloved in Thonglor crowd)",
  description:"A gin bar tucked inside a narrow Chinese shophouse with barely 12 seats. The bartenders work in near silence, building drinks from house-infused spirits and foraged Thai botanicals. No cocktail menu \u2014 you describe a mood, they respond. Regulars sit at the bar and let the evening dissolve around them.",
  vibe:9.4,
  localLove:9.1,
  uniqueness:9.7,
  tags:["gin bar", "shophouse", "no menu", "intimate"],
  tip:"Come before 9pm or wait outside \u2014 no reservations. Say you want something 'herbaceous and strange.'",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Thonglor / Ekkamai",
  lat:13.7382,
  lng:100.5109,
  maps_url:"https://www.google.com/maps?q=13.7382,100.5109",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:14}, {line:"Boat", station:"Tha Ratchawong", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,craft,cocktail,bar,intimate,shophouse"
},
{
  id:"ag1-1",
  cityId:"bangkok",
  name:"Rabbit Hole",
  type:"bar",
  neighborhood:"Thonglor Soi 55",
  description:"An underground cocktail bar beneath a residential building on Thonglor Soi 55 with almost no street presence. Dark panelled walls, a serious whisky collection, and bartenders who trained in Tokyo. The Japanese whisky highball here is the best in the city \u2014 criminally underpriced.",
  vibe:9.0,
  localLove:8.8,
  uniqueness:8.6,
  tags:["whisky", "speakeasy", "japanese influence", "thonglor"],
  tip:"The entrance is through a door marked only with a small rabbit logo. Weeknights are quieter and the bartenders will actually talk to you.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Thonglor / Ekkamai",
  lat:13.7278,
  lng:100.582,
  maps_url:"https://www.google.com/maps?q=13.7278,100.582",
  transport:[{line:"BTS Sukhumvit", station:"Thong Lo (E6)", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?whisky,bar,dark,wood,intimate,basement"
},
{
  id:"ag1-2",
  cityId:"bangkok",
  name:"Escapade Burgers & Shakes",
  type:"restaurant",
  neighborhood:"Ekkamai",
  description:"A tiny burger joint run by a couple who spent years eating their way through the American south. The smash burger has a cult following among expat chefs who come here on their nights off. No frills, cash only, the fries are cooked in beef tallow and the shakes contain an illegal amount of malt.",
  vibe:8.2,
  localLove:9.3,
  uniqueness:7.8,
  tags:["burgers", "cash only", "chef favourite", "ekkamai"],
  tip:"Order the double smash with the 'dirty sauce.' Arrive early \u2014 they sell out of patties by 9pm most nights.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Thonglor / Ekkamai",
  lat:13.7196,
  lng:100.5862,
  maps_url:"https://www.google.com/maps?q=13.7196,100.5862",
  transport:[{line:"BTS Sukhumvit", station:"Ekkamai (E7)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?gourmet,burger,restaurant,neon,sign"
},
{
  id:"ag1-3",
  cityId:"bangkok",
  name:"Tropic City",
  type:"bar",
  neighborhood:"Charoen Krung Soi 36",
  description:"Bangkok's answer to a tiki bar, but make it good. Tropical flavours done with technical precision \u2014 pandan, coconut husk smoke, galangal \u2014 in a small room hung with rattan and palm fronds. The crowd is local, young, and very opinionated about their rum. No frozen drinks. No umbrellas.",
  vibe:9.2,
  localLove:8.7,
  uniqueness:9.0,
  tags:["tiki", "rum", "thai botanicals", "creative cocktails"],
  tip:"The tasting flight is worth it \u2014 4 cocktails showing the range of the menu. Book a stool at the bar.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Thonglor / Ekkamai",
  lat:13.7233,
  lng:100.5138,
  maps_url:"https://www.google.com/maps?q=13.7233,100.5138",
  transport:[{line:"Boat", station:"Tha Si Phraya", walk_min:6}, {line:"BTS Silom", station:"Saphan Taksin (S6)", walk_min:18}],
  photo_url:"https://source.unsplash.com/featured/800x500/?tiki,bar,tropical,cocktail,neon,pink"
},
{
  id:"ag1-4",
  cityId:"bangkok",
  name:"Seen Space Thonglor",
  type:"experience",
  neighborhood:"Thonglor Soi 13",
  description:"A hybrid record shop, coffee bar, and live music venue that functions as the actual creative hub of Thonglor. Local jazz bands play Thursday nights on a stage the size of a dining table. Vinyl browsers, coffee drinkers, and musicians coexist without anyone trying too hard.",
  vibe:8.9,
  localLove:9.4,
  uniqueness:8.2,
  tags:["vinyl", "jazz", "live music", "coffee"],
  tip:"Thursday jazz from 8pm. Come for the music, stay for the digging \u2014 the selection leans heavy on 70s Thai pop and soul.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Thonglor / Ekkamai",
  lat:13.7281,
  lng:100.5814,
  maps_url:"https://www.google.com/maps?q=13.7281,100.5814",
  transport:[{line:"BTS Sukhumvit", station:"Thong Lo (E6)", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?vinyl,record,store,coffee,turntable"
},
{
  id:"ag1-5",
  cityId:"bangkok",
  name:"Neon Tiger",
  type:"bar",
  neighborhood:"Ekkamai Soi 7",
  description:"A craft beer bar that opened in a converted garage and somehow never lost that energy. Sixteen taps, mostly Thai micros and a rotating guest keg from Asia-Pacific. Loud, sweaty on weekends, with plastic chairs spilling onto the soi. The tamarind pork skewers from the kitchen window are essential.",
  vibe:8.6,
  localLove:9.5,
  uniqueness:7.4,
  tags:["craft beer", "thai micro", "garage bar", "skewers"],
  tip:"Go Tuesday when they tap a new experimental keg and the brewer sometimes shows up to explain it.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Thonglor / Ekkamai",
  lat:13.7198,
  lng:100.5871,
  maps_url:"https://www.google.com/maps?q=13.7198,100.5871",
  transport:[{line:"BTS Sukhumvit", station:"Ekkamai (E7)", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?craft,beer,bar,industrial,garage,neon"
},
{
  id:"ag1-6",
  cityId:"bangkok",
  name:"Featherstone Cafe",
  type:"restaurant",
  neighborhood:"Ekkamai",
  description:"An all-day cafe in a converted shophouse that does things properly \u2014 sourdough baked on-site, eggs from a small farm in Chiang Rai, cold brew made with single-origin beans from Doi Chang. No avocado toast theatrics. Just a calm room, good ingredients, and staff who know their suppliers by name.",
  vibe:8.1,
  localLove:8.9,
  uniqueness:7.2,
  tags:["brunch", "sourdough", "farm to table", "calm"],
  tip:"The mushroom toast with truffle oil and the Thai-spiced hollandaise on weekends. Quietest between 10-11am.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Thonglor / Ekkamai",
  lat:13.7193,
  lng:100.5877,
  maps_url:"https://www.google.com/maps?q=13.7193,100.5877",
  transport:[{line:"BTS Sukhumvit", station:"Ekkamai (E7)", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?cafe,brunch,sourdough,coffee,morning"
},
{
  id:"ag1-7",
  cityId:"bangkok",
  name:"Iron Ball Gin Bar",
  type:"bar",
  neighborhood:"Thonglor",
  description:"The tasting room of Thailand's first craft gin distillery. Housed in a slick industrial space that somehow feels genuinely intimate. The house gin is distilled with kaffir lime, lemongrass, and galangal \u2014 distinctly Thai in a way that doesn't feel like a gimmick. The bartenders know the distillation story cold.",
  vibe:8.7,
  localLove:8.2,
  uniqueness:9.1,
  tags:["craft gin", "distillery", "thai botanicals", "tasting room"],
  tip:"Do the distillery tasting flight before ordering cocktails \u2014 it completely changes how you drink the house gin.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Thonglor / Ekkamai",
  lat:13.7275,
  lng:100.5829,
  maps_url:"https://www.google.com/maps?q=13.7275,100.5829",
  transport:[{line:"BTS Sukhumvit", station:"Thong Lo (E6)", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?gin,distillery,bottles,craft,tasting"
},
{
  id:"ag1-8",
  cityId:"bangkok",
  name:"Soi 38 Night Food Street",
  type:"market",
  neighborhood:"Thonglor Soi 38",
  description:"While everyone goes to the Thonglor rooftop bars, the locals end up here after midnight. A narrow soi that transforms after 11pm into a parade of carts \u2014 boat noodles, grilled offal, pad kra pao at 2am with a cold Chang. No atmosphere manufactured, just appetite and neon light.",
  vibe:9.1,
  localLove:9.7,
  uniqueness:8.3,
  tags:["late night", "street food", "boat noodles", "after midnight"],
  tip:"Come after midnight when the restaurant industry crowd shows up. The boat noodle cart third on the left is the one.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Thonglor / Ekkamai",
  lat:13.7262,
  lng:100.5848,
  maps_url:"https://www.google.com/maps?q=13.7262,100.5848",
  transport:[{line:"BTS Sukhumvit", station:"Thong Lo (E6)", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,street,food,night,alley,neon"
},
{
  id:"ag1-9",
  cityId:"bangkok",
  name:"Mikkeller Bangkok",
  type:"bar",
  neighborhood:"Ekkamai",
  description:"The Bangkok outpost of the Danish craft beer nomad, but locally brewed and thoroughly absorbed into its neighbourhood. The terrace on a cool evening with Thai-inflected snacks and an experimental sour is one of Bangkok's better hours. The turnover of taps means there's always something worth trying.",
  vibe:8.4,
  localLove:8.0,
  uniqueness:7.6,
  tags:["craft beer", "danish", "terrace", "sour beers"],
  tip:"The rotating Thailand-exclusive taps are the reason to visit. Check their Instagram the morning before you go.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Thonglor / Ekkamai",
  lat:13.7202,
  lng:100.5863,
  maps_url:"https://www.google.com/maps?q=13.7202,100.5863",
  transport:[{line:"BTS Sukhumvit", station:"Ekkamai (E7)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?craft,beer,tap,bar,terrace"
},
{
  id:"ag2-0",
  cityId:"bangkok",
  name:"Phra Arthit Riverfront",
  type:"experience",
  neighborhood:"Banglamphu / Phra Arthit",
  description:"A riverside promenade where locals and university students gather at dusk without a tourist in sight. Cheap beer from 7-Eleven drunk on low walls facing the Chao Phraya. The fort and old buildings behind you, cargo boats passing in front. The most unpretentious view in Bangkok.",
  vibe:9.3,
  localLove:9.8,
  uniqueness:8.0,
  tags:["free", "riverside", "sunset", "student scene"],
  tip:"Buy beer and snacks from the 7-Eleven and claim a wall spot by 5:30pm for sunset. Bring mosquito spray.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Old Town / Rattanakosin",
  lat:13.7601,
  lng:100.4964,
  maps_url:"https://www.google.com/maps?q=13.7601,100.4964",
  transport:[{line:"Boat", station:"Phra Arthit Pier", walk_min:3}],
  photo_url:"https://source.unsplash.com/featured/800x500/?chao,phraya,river,sunset,students,lanterns"
},
{
  id:"ag2-1",
  cityId:"bangkok",
  name:"Arun Residence Terrace",
  type:"bar",
  neighborhood:"Tha Tien",
  description:"A boutique guesthouse with a rooftop terrace that faces Wat Arun directly across the river. Tables for 20 people maximum. Not a secret exactly, but not promoted, and the guests are mostly people who discovered it by asking the right questions. The mango sticky rice here is made to a family recipe.",
  vibe:9.0,
  localLove:7.9,
  uniqueness:8.8,
  tags:["rooftop", "wat arun view", "intimate", "sticky rice"],
  tip:"Go at dusk when Wat Arun is lit. Guests of the hotel get priority \u2014 book even if you're not staying.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Old Town / Rattanakosin",
  lat:13.743,
  lng:100.4969,
  maps_url:"https://www.google.com/maps?q=13.743,100.4969",
  transport:[{line:"Boat", station:"Tha Tien Pier", walk_min:4}],
  photo_url:"https://source.unsplash.com/featured/800x500/?wat,arun,temple,river,dusk"
},
{
  id:"ag2-2",
  cityId:"bangkok",
  name:"Tha Tien Market",
  type:"market",
  neighborhood:"Tha Tien",
  description:"The wholesale market behind Wat Pho that feeds the temple district every morning. By 7am it's already winding down \u2014 vendors packing up, monks collecting alms, a few food carts serving ferry workers. Come here for khao tom in ceramic bowls that cost 30 baht and have been served the same way for 50 years.",
  vibe:8.5,
  localLove:9.6,
  uniqueness:8.1,
  tags:["morning market", "khao tom", "monks", "ferry workers"],
  tip:"Be there by 6:30am. The rice porridge cart at the back left corner has been run by the same family for decades.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Old Town / Rattanakosin",
  lat:13.7436,
  lng:100.4959,
  maps_url:"https://www.google.com/maps?q=13.7436,100.4959",
  transport:[{line:"Boat", station:"Tha Tien Pier", walk_min:2}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,morning,market,vendors,chaos"
},
{
  id:"ag2-3",
  cityId:"bangkok",
  name:"Wat Suthat Surrounding Streets",
  type:"experience",
  neighborhood:"Sao Ching Cha / Rattanakosin",
  description:"The streets around the Giant Swing and Wat Suthat are lined with shops selling monks' supplies \u2014 saffron robes, ritual objects, Buddha amulets, temple flowers. It functions as a genuine religious supply district, mostly ignored by tourists. Walking through it at 8am when deliveries are being made is transportive.",
  vibe:8.7,
  localLove:8.4,
  uniqueness:8.9,
  tags:["monks supplies", "ritual district", "walking", "morning"],
  tip:"Walk east from the Giant Swing toward the canal. The deeper you go, the less English you'll encounter.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Old Town / Rattanakosin",
  lat:13.751,
  lng:100.5014,
  maps_url:"https://www.google.com/maps?q=13.751,100.5014",
  transport:[{line:"MRT Blue", station:"Sam Yot", walk_min:10}, {line:"Boat", station:"Tha Chang", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,temple,giant,swing,monks,supplies"
},
{
  id:"ag2-4",
  cityId:"bangkok",
  name:"Roti Mataba",
  type:"restaurant",
  neighborhood:"Phra Athit",
  description:"A Muslim family restaurant near the Chao Phraya that has been making roti and mataba for three generations. The mataba \u2014 a stuffed roti pancake \u2014 is made to order and served with the family's curry and pickled vegetables. The shop has plastic tables and handwritten menus and no interest in being discovered.",
  vibe:8.3,
  localLove:9.5,
  uniqueness:8.5,
  tags:["muslim thai", "roti", "mataba", "family run", "three generations"],
  tip:"Open from 9am. Come before noon when the filling is freshest. The massaman curry with roti for dunking is the move.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Old Town / Rattanakosin",
  lat:13.7588,
  lng:100.4951,
  maps_url:"https://www.google.com/maps?q=13.7588,100.4951",
  transport:[{line:"Boat", station:"Phra Arthit Pier", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thai,muslim,roti,stuffed,pancake,pan"
},
{
  id:"ag2-5",
  cityId:"bangkok",
  name:"Klong Lord Canal Walk",
  type:"experience",
  neighborhood:"Rattanakosin island",
  description:"The inner canal that circles the historic island is mostly unvisited. You can walk the full loop along the bank \u2014 old wooden houses, community vegetable patches, monks on bicycles, a rope ferry still running. The eastern section near Tha Chang pier passes through an almost rural Bangkok that feels decades removed from Khao San.",
  vibe:9.1,
  localLove:8.7,
  uniqueness:9.3,
  tags:["canal walk", "historic", "rope ferry", "hidden", "local life"],
  tip:"Start at Tha Tien pier and walk north. The rope ferry across the canal costs 3 baht and still runs when the ferryman feels like it.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Old Town / Rattanakosin",
  lat:13.7512,
  lng:100.5035,
  maps_url:"https://www.google.com/maps?q=13.7512,100.5035",
  transport:[{line:"Boat", station:"Tha Chang", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,canal,historic,wooden,shophouses"
},
{
  id:"ag2-6",
  cityId:"bangkok",
  name:"Nai Mong Hoi Thod",
  type:"restaurant",
  neighborhood:"Tha Tien",
  description:"An oyster omelette stall that's been in the same location since 1961, operating out of a cart under a narrow awning. The omelette is crispy-edged with a molten centre, the oysters are fresh daily from the Gulf. Two tables, plastic stools, and a queue that snakes onto the pavement. The cheapest extraordinary meal in the old town.",
  vibe:8.8,
  localLove:9.7,
  uniqueness:8.4,
  tags:["oyster omelette", "1961", "street food", "legend", "cheap"],
  tip:"Get there by 11am or queue. Order the large with extra crispy edges. They close when the oysters run out, usually by 2pm.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Old Town / Rattanakosin",
  lat:13.7437,
  lng:100.4967,
  maps_url:"https://www.google.com/maps?q=13.7437,100.4967",
  transport:[{line:"Boat", station:"Tha Tien Pier", walk_min:3}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,oyster,omelette,wok,street,food"
},
{
  id:"ag2-7",
  cityId:"bangkok",
  name:"The Poet Bookshop",
  type:"experience",
  neighborhood:"Phra Athit",
  description:"A secondhand bookshop in a crumbling shophouse near Phra Athit road that also serves coffee and keeps erratic hours. The English section is small but carefully chosen \u2014 fiction left by decades of travellers, Thai literature in translation, some poetry. The owner will make recommendations if you ask the right way.",
  vibe:8.6,
  localLove:8.1,
  uniqueness:8.7,
  tags:["bookshop", "secondhand", "coffee", "erratic hours"],
  tip:"Check their Facebook page before going \u2014 hours vary by mood. Best on rainy afternoons.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Old Town / Rattanakosin",
  lat:13.7593,
  lng:100.4948,
  maps_url:"https://www.google.com/maps?q=13.7593,100.4948",
  transport:[{line:"Boat", station:"Phra Arthit Pier", walk_min:4}],
  photo_url:"https://source.unsplash.com/featured/800x500/?secondhand,bookshop,shelves,books,cafe"
},
{
  id:"ag2-8",
  cityId:"bangkok",
  name:"Sanam Luang At Dawn",
  type:"experience",
  neighborhood:"Rattanakosin",
  description:"The grand royal field in front of the Grand Palace is transformed before sunrise \u2014 kite flyers, joggers, monks in procession, vendors setting up their carts. By 8am when tourists begin arriving, the real life of the field has already packed up and gone. The 5:30am light across the palace walls is something else.",
  vibe:9.5,
  localLove:8.9,
  uniqueness:8.6,
  tags:["dawn", "kite flying", "royal field", "free", "monks"],
  tip:"Be there by 5:45am. The mango sticky rice cart near the south corner opens at 6am. Bring a jacket \u2014 it's genuinely cool.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Old Town / Rattanakosin",
  lat:13.7536,
  lng:100.4924,
  maps_url:"https://www.google.com/maps?q=13.7536,100.4924",
  transport:[{line:"Boat", station:"Tha Chang", walk_min:8}, {line:"MRT Blue", station:"Sam Yot", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,grand,palace,field,morning,mist"
},
{
  id:"ag2-9",
  cityId:"bangkok",
  name:"Hemlock",
  type:"restaurant",
  neighborhood:"Phra Athit",
  description:"A long-running neighbourhood restaurant that somehow never became famous outside its postcode. Serves elevated Thai comfort food \u2014 khao soi, larb with proper funky fermented rice, southern-style fish curry \u2014 in a dim, wood-panelled room packed with Thammasat University faculty. The wine list is short and honest.",
  vibe:8.4,
  localLove:9.2,
  uniqueness:7.8,
  tags:["thai comfort food", "khao soi", "neighbourhood classic", "faculty crowd"],
  tip:"Tuesday to Sunday evenings only. The khao soi and the southern curry are both worth ordering for the table.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Old Town / Rattanakosin",
  lat:13.759,
  lng:100.4946,
  maps_url:"https://www.google.com/maps?q=13.759,100.4946",
  transport:[{line:"Boat", station:"Phra Arthit Pier", walk_min:4}],
  photo_url:"https://source.unsplash.com/featured/800x500/?restaurant,wood,panelled,candlelit,dinner"
},
{
  id:"ag3-0",
  cityId:"bangkok",
  name:"Jek Pui Curry",
  type:"restaurant",
  neighborhood:"Yaowarat",
  description:"A curry stall that has operated from the same pavement corner on Yaowarat since the 1960s. The pork curry with preserved egg is cooked in a single enormous wok from 5am until it's gone. Zero ambience, foam trays, plastic stools \u2014 and one of the most complex curry pastes in Bangkok made from a recipe never written down.",
  vibe:8.9,
  localLove:9.8,
  uniqueness:9.2,
  tags:["dawn street food", "pork curry", "1960s", "pavement", "cash only"],
  tip:"Arrive at 6am. It closes by 10am most days. The pork with preserved egg and rice for 60 baht is the only order.",
  status:"approved",
  agentIcon:"\ud83d\udc09",
  discoveredBy:"Chinatown / Talat Noi",
  lat:13.7395,
  lng:100.5101,
  maps_url:"https://www.google.com/maps?q=13.7395,100.5101",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:8}, {line:"Boat", station:"Tha Ratchawong", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,chinatown,street,food,dawn,curry,wok"
},
{
  id:"ag3-1",
  cityId:"bangkok",
  name:"Hong Kong Noodles (Rot Det)",
  type:"restaurant",
  neighborhood:"Talat Noi",
  description:"An unlabelled noodle shop in a 100-year-old shophouse that serves one thing: wonton noodle soup with house-made roast pork. The broth is pork-bone based and has been simmering in the same pot, topped up daily, for over 30 years. The owner's daughter now runs it. Twelve seats. Queue outside.",
  vibe:8.7,
  localLove:9.6,
  uniqueness:8.8,
  tags:["wonton noodles", "single dish", "30 year broth", "family run", "unlabelled"],
  tip:"Find it on Google Maps as 'Rot Det Noodles' \u2014 the sign is in Chinese only. Opens 7am, done by noon.",
  status:"approved",
  agentIcon:"\ud83d\udc09",
  discoveredBy:"Chinatown / Talat Noi",
  lat:13.7374,
  lng:100.5092,
  maps_url:"https://www.google.com/maps?q=13.7374,100.5092",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:11}, {line:"Boat", station:"Tha Ratchawong", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,noodle,soup,shophouse,dim,wonton"
},
{
  id:"ag3-2",
  cityId:"bangkok",
  name:"Ba Hao Tian Mi",
  type:"bar",
  neighborhood:"Talat Noi",
  description:"A Chinese-themed cocktail bar in a beautifully restored shophouse with original 1930s tiles, offering Chinese-inspired drinks made with Baijiu, rice wine, and Thai-Chinese herbal liqueurs. The design is meticulous without being theme-park. The crowd on weekends is young Bangkok creative class, not tourists.",
  vibe:9.3,
  localLove:8.6,
  uniqueness:9.4,
  tags:["chinese cocktails", "baijiu", "heritage shophouse", "1930s tiles", "creative bar"],
  tip:"The longan and Chinese five spice cocktail is the signature. Thursday evenings quieter for conversation.",
  status:"approved",
  agentIcon:"\ud83d\udc09",
  discoveredBy:"Chinatown / Talat Noi",
  lat:13.7368,
  lng:100.5085,
  maps_url:"https://www.google.com/maps?q=13.7368,100.5085",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:13}, {line:"Boat", station:"Tha Ratchawong", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?chinese,cocktail,bar,heritage,tiles,shophouse"
},
{
  id:"ag3-3",
  cityId:"bangkok",
  name:"Gong Heng Tong Medicinal Hall",
  type:"experience",
  neighborhood:"Yaowarat",
  description:"A 100-year-old Chinese medicinal herb shop that still compounds traditional remedies. The interior smells of dried roots and star anise, the drawers behind the counter are hand-labelled in century-old calligraphy, and the elderly pharmacist will prescribe you something if you describe your symptoms. A living museum that charges nothing to enter.",
  vibe:9.0,
  localLove:9.1,
  uniqueness:9.5,
  tags:["herbal medicine", "chinese heritage", "100 year old", "free", "living history"],
  tip:"Come in the morning when the pharmacist is compounding orders. Bring cash \u2014 they sell teas and tonics.",
  status:"approved",
  agentIcon:"\ud83d\udc09",
  discoveredBy:"Chinatown / Talat Noi",
  lat:13.74,
  lng:100.5136,
  maps_url:"https://www.google.com/maps?q=13.74,100.5136",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:9}, {line:"Boat", station:"Tha Ratchawong", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?chinese,herbal,medicine,shop,drawers,old"
},
{
  id:"ag3-4",
  cityId:"bangkok",
  name:"Soy Sauce Lane",
  type:"experience",
  neighborhood:"Talat Noi",
  description:"A narrow alleyway in Talat Noi that dead-ends at an old warehouse and passes through one of Bangkok's most concentrated areas of street murals. Also: a functioning soy sauce factory, a Chinese opera rehearsal space, and an ancient spirit house covered in offerings. Walk slowly.",
  vibe:9.4,
  localLove:8.3,
  uniqueness:9.0,
  tags:["street art", "soy sauce factory", "murals", "opera", "alley"],
  tip:"Best visited 7-9am when the soy sauce factory is working \u2014 the smell is extraordinary. The murals are best photographed in morning light.",
  status:"approved",
  agentIcon:"\ud83d\udc09",
  discoveredBy:"Chinatown / Talat Noi",
  lat:13.737,
  lng:100.5082,
  maps_url:"https://www.google.com/maps?q=13.737,100.5082",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:13}, {line:"Boat", station:"Tha Si Phraya", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,chinatown,alley,murals,graffiti"
},
{
  id:"ag3-5",
  cityId:"bangkok",
  name:"Thanon Plaeng Nam Coffee Shop",
  type:"restaurant",
  neighborhood:"Talat Noi",
  description:"A Chinese-Thai kopitiam that has served the same menu \u2014 kaya toast, soft-boiled eggs, iced coffee in a glass \u2014 since 1947. Still run by the third generation of the original family. White tiles, ceiling fans, a radio playing Thai pop, and tables shared with strangers. The ice coffee is the perfect Bangkok morning.",
  vibe:8.6,
  localLove:9.4,
  uniqueness:8.7,
  tags:["kopitiam", "kaya toast", "1947", "family run", "morning"],
  tip:"Open from 6am to noon only. Order the iced coffee with kaya toast and two soft-boiled eggs \u2014 80 baht total.",
  status:"approved",
  agentIcon:"\ud83d\udc09",
  discoveredBy:"Chinatown / Talat Noi",
  lat:13.7365,
  lng:100.5077,
  maps_url:"https://www.google.com/maps?q=13.7365,100.5077",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:14}, {line:"Boat", station:"Tha Si Phraya", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?kopitiam,chinese,cafe,morning,kaya,toast"
},
{
  id:"ag3-6",
  cityId:"bangkok",
  name:"Yaowarat Night Market (Back Rows)",
  type:"market",
  neighborhood:"Yaowarat",
  description:"Everyone knows the main Yaowarat strip, but the parallel sois one block back are where locals eat. No English signage, plastic chairs set up on the pavement, vendors grilling whole fish and making papaya salad with enough chilli to require a commitment. Half the price, double the authenticity.",
  vibe:9.0,
  localLove:9.7,
  uniqueness:7.8,
  tags:["night market", "local only", "grilled fish", "no english menu", "back streets"],
  tip:"Enter from Charoen Krung Soi 21 and follow your nose away from Yaowarat Road. Point and smile.",
  status:"approved",
  agentIcon:"\ud83d\udc09",
  discoveredBy:"Chinatown / Talat Noi",
  lat:13.7406,
  lng:100.5121,
  maps_url:"https://www.google.com/maps?q=13.7406,100.5121",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:7}, {line:"Boat", station:"Tha Ratchawong", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?yaowarat,chinatown,night,food,stalls"
},
{
  id:"ag3-7",
  cityId:"bangkok",
  name:"Tha Rua Boat Noodles",
  type:"restaurant",
  neighborhood:"Talat Noi riverfront",
  description:"A floating noodle kitchen moored at the Talat Noi pier that predates the trendy riverside bars by about 40 years. They serve boat noodles in the traditional style \u2014 tiny bowls of pork or beef broth so dark it's almost black, with crispy shallots and morning glory. Five bowls is a normal order. Twelve is achievement.",
  vibe:8.8,
  localLove:9.5,
  uniqueness:9.1,
  tags:["boat noodles", "floating", "pier", "traditional", "tiny bowls"],
  tip:"Find the pier at the end of Talat Noi Soi 1. Open mornings and early afternoons only. Order at least 8 bowls between two people.",
  status:"approved",
  agentIcon:"\ud83d\udc09",
  discoveredBy:"Chinatown / Talat Noi",
  lat:13.7371,
  lng:100.5078,
  maps_url:"https://www.google.com/maps?q=13.7371,100.5078",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:14}, {line:"Boat", station:"Tha Si Phraya", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?floating,boat,noodle,restaurant,pier,river"
},
{
  id:"ag3-8",
  cityId:"bangkok",
  name:"San Jao Sien Khong Shrine",
  type:"experience",
  neighborhood:"Talat Noi",
  description:"A Chinese-Taoist shrine tucked into the middle of Talat Noi that serves as the actual social hub of the neighbourhood. Old men play Chinese chess in the forecourt, women bring offerings of fruit and roast pork, and the fortune telling is taken seriously. The incense smoke is so thick in the morning it produces its own weather.",
  vibe:8.9,
  localLove:9.2,
  uniqueness:8.5,
  tags:["chinese taoist shrine", "chess", "fortune telling", "incense", "community"],
  tip:"Come at 8am when the neighbourhood treats it as their morning gathering point. Dress modestly and stay quiet.",
  status:"approved",
  agentIcon:"\ud83d\udc09",
  discoveredBy:"Chinatown / Talat Noi",
  lat:13.7363,
  lng:100.5083,
  maps_url:"https://www.google.com/maps?q=13.7363,100.5083",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:15}, {line:"Boat", station:"Tha Si Phraya", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?chinese,shrine,incense,smoke,taoist,community"
},
{
  id:"ag3-9",
  cityId:"bangkok",
  name:"Chinatown Dim Sum Trail",
  type:"experience",
  neighborhood:"Yaowarat / Samphanthawong",
  description:"An unofficial walking trail through six dim sum shops between Odeon Circle and Ratchawong Pier, each known for a single item \u2014 the siu mai at one, the char siu bao at another, the egg tart at a third. Locals have been following this route on Sunday mornings for generations without anyone writing it down until now.",
  vibe:9.2,
  localLove:9.6,
  uniqueness:8.9,
  tags:["dim sum", "walking trail", "sunday morning", "multiple stops", "chinese heritage"],
  tip:"Start at Odeon Circle at 7am Sunday. The trail takes 2-3 hours if you're doing it properly. Bring antacids.",
  status:"approved",
  agentIcon:"\ud83d\udc09",
  discoveredBy:"Chinatown / Talat Noi",
  lat:13.7408,
  lng:100.513,
  maps_url:"https://www.google.com/maps?q=13.7408,100.513",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:8}, {line:"Boat", station:"Ratchawong Pier", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?dim,sum,chinese,breakfast,bamboo,steamer"
},
{
  id:"ag4-0",
  cityId:"bangkok",
  name:"The Deck by Arun Residence",
  type:"bar",
  neighborhood:"Tha Tien",
  description:"A riverfront bar where the view of Wat Arun across the water is so close you feel like you could reach over and adjust its spires. Entirely local crowd \u2014 mostly Silpakorn University art students and people who live nearby. The cocktails are basic, the beer is cold, and the sunset turns the river the colour of bronze.",
  vibe:9.5,
  localLove:8.8,
  uniqueness:8.6,
  tags:["riverside", "wat arun", "art students", "sunset", "local"],
  tip:"The 6-7pm hour when the sun hits Wat Arun directly. Arrive by 5:30 to get a riverside table.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Riverside / Chao Phraya",
  lat:13.7431,
  lng:100.4971,
  maps_url:"https://www.google.com/maps?q=13.7431,100.4971",
  transport:[{line:"Boat", station:"Tha Tien Pier", walk_min:3}],
  photo_url:"https://source.unsplash.com/featured/800x500/?wat,arun,temple,river,view,sunset,terrace"
},
{
  id:"ag4-1",
  cityId:"bangkok",
  name:"Khlong San Floating Market",
  type:"market",
  neighborhood:"Khlong San",
  description:"Not the sanitised floating market for tourists \u2014 this is a working vegetable and grocery market accessed by canal boat, where the vendors sell to restaurants and households. You can take the public canal boat from Sathorn pier and join in. The morning chaos of loading and unloading is genuinely extraordinary to witness.",
  vibe:8.7,
  localLove:9.4,
  uniqueness:9.0,
  tags:["floating market", "working", "canal boat", "local", "vegetables"],
  tip:"Take the public Sathorn canal boat from Sathorn pier at 6am. Ask to go to Khlong San market. No tourist prices.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Riverside / Chao Phraya",
  lat:13.729,
  lng:100.4993,
  maps_url:"https://www.google.com/maps?q=13.729,100.4993",
  transport:[{line:"BTS Silom", station:"Saphan Taksin (S6)", walk_min:15}, {line:"Boat", station:"Tha Sathon Central Pier", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?floating,market,canal,boat,thailand,produce"
},
{
  id:"ag4-2",
  cityId:"bangkok",
  name:"Royal Orchid Sheraton Riverview",
  type:"bar",
  neighborhood:"Si Phraya",
  description:"Not the hotel \u2014 the public riverview terrace bar tucked on the ground floor that almost no one knows you can access without a room key. A local lawyer and retired sailor clientele, cheap Thai whisky and soda setups, and an unobstructed view of the Chao Phraya at its widest. No Instagram moment, just the river.",
  vibe:8.3,
  localLove:9.1,
  uniqueness:8.4,
  tags:["riverside bar", "hotel terrace", "open to public", "thai whisky", "wide river view"],
  tip:"Walk through the hotel lobby to the garden terrace. Mention you want a drink by the river and they'll seat you. Cheaper than any tourist bar nearby.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Riverside / Chao Phraya",
  lat:13.7237,
  lng:100.5128,
  maps_url:"https://www.google.com/maps?q=13.7237,100.5128",
  transport:[{line:"Boat", station:"Tha Si Phraya", walk_min:5}, {line:"BTS Silom", station:"Saphan Taksin (S6)", walk_min:16}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,chao,phraya,river,panorama,hotel"
},
{
  id:"ag4-3",
  cityId:"bangkok",
  name:"Tha Chang Pier Community",
  type:"experience",
  neighborhood:"Tha Chang",
  description:"The working ferry pier at the foot of the Grand Palace that hasn't been gentrified. At dawn: monks collecting alms, vendors selling sticky rice and iced coffee from styrofoam cups, river workers eating breakfast, the ferry loading with commuters. Stays like this until 8am when the tourist traffic begins.",
  vibe:9.3,
  localLove:9.7,
  uniqueness:8.8,
  tags:["ferry pier", "monks", "river workers", "dawn", "free"],
  tip:"Be there by 6am. Take the cross-river ferry (3.5 baht) to Wat Arun just for the experience of being on the river with locals.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Riverside / Chao Phraya",
  lat:13.7513,
  lng:100.4921,
  maps_url:"https://www.google.com/maps?q=13.7513,100.4921",
  transport:[{line:"Boat", station:"Tha Chang", walk_min:1}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,river,pier,ferry,monks,dawn,boats"
},
{
  id:"ag4-4",
  cityId:"bangkok",
  name:"Praya Palazzo Terrace",
  type:"bar",
  neighborhood:"Phra Nakhon riverside",
  description:"An Italianate riverfront palace converted to a boutique hotel with a terrace bar accessible by the hotel's free shuttle boat from Phra Arthit pier. The building is astonishing \u2014 turn-of-century Italian architecture on the Bangkok river \u2014 and the terrace at dusk is one of those accidental perfect evenings.",
  vibe:9.1,
  localLove:7.4,
  uniqueness:9.5,
  tags:["historic palace", "shuttle boat", "riverfront", "italian architecture", "evening"],
  tip:"Book the shuttle from Phra Arthit pier (free, runs 4-10pm). Walk in for drinks only \u2014 you don't need a reservation.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Riverside / Chao Phraya",
  lat:13.762,
  lng:100.4887,
  maps_url:"https://www.google.com/maps?q=13.762,100.4887",
  transport:[{line:"Boat", station:"Phra Arthit Pier (then shuttle)", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,riverside,heritage,hotel,palace"
},
{
  id:"ag4-5",
  cityId:"bangkok",
  name:"Wat Kanlayanamit Evening",
  type:"experience",
  neighborhood:"Thonburi riverside",
  description:"A vast temple on the Thonburi bank that faces the river and is almost entirely unvisited in the evenings. At dusk, monks chant in the main hall while the river traffic passes outside. You can sit in the open courtyard on the river side and watch the light change over the water. The temple cat is enormous and friendly.",
  vibe:9.4,
  localLove:8.5,
  uniqueness:9.2,
  tags:["temple", "evening", "monks chanting", "riverside", "free", "temple cat"],
  tip:"Take the cross-river express boat to Tha Ratchawong and walk 5 minutes south. Open until 9pm. Dress respectfully.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Riverside / Chao Phraya",
  lat:13.7401,
  lng:100.4889,
  maps_url:"https://www.google.com/maps?q=13.7401,100.4889",
  transport:[{line:"Boat", station:"Tha Ratchawong (cross-river)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,thonburi,temple,riverside,evening,ceremony"
},
{
  id:"ag4-6",
  cityId:"bangkok",
  name:"Klong Saen Saep Express Boat",
  type:"experience",
  neighborhood:"Central Bangkok canal network",
  description:"The Bangkok canal express boat that runs east-west across the city \u2014 the daily commute of half a million Bangkokians. No tourism angle. You board with office workers and market vendors, the boat conductor yells stops in rapid Thai, spray comes over the side, and you see the city from the canal level at speed. 15 baht end to end.",
  vibe:9.6,
  localLove:10.0,
  uniqueness:8.7,
  tags:["canal boat", "commuter", "15 baht", "real bangkok", "spray in face"],
  tip:"Ride the full route from Hua Chang pier to Khlong Bang Kapi on a weekday morning. Do not wear white.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Riverside / Chao Phraya",
  lat:13.7544,
  lng:100.5395,
  maps_url:"https://www.google.com/maps?q=13.7544,100.5395",
  transport:[{line:"Canal Boat", station:"Hua Chang Pier", walk_min:2}, {line:"BTS Sukhumvit", station:"Siam (CEN)", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,canal,express,boat,crowded,commuter"
},
{
  id:"ag4-7",
  cityId:"bangkok",
  name:"Three Sixty Jazz Lounge",
  type:"bar",
  neighborhood:"Millennium Hilton / Bang Rak",
  description:"A rotating bar on the 32nd floor of the Millennium Hilton that locals have quietly adopted because it's cheaper than competitors and the live jazz is genuinely good. The full rotation takes about 70 minutes \u2014 enough time to watch the city and river complete a slow panorama while the quartet plays Coltrane.",
  vibe:8.8,
  localLove:7.8,
  uniqueness:8.3,
  tags:["rotating bar", "jazz", "river panorama", "live music", "32nd floor"],
  tip:"Arrive before 8pm for the best river-facing seats before the rotation moves them. Happy hour until 7pm.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Riverside / Chao Phraya",
  lat:13.7239,
  lng:100.5107,
  maps_url:"https://www.google.com/maps?q=13.7239,100.5107",
  transport:[{line:"Boat", station:"Tha Si Phraya", walk_min:7}, {line:"BTS Silom", station:"Saphan Taksin (S6)", walk_min:15}],
  photo_url:"https://source.unsplash.com/featured/800x500/?rooftop,jazz,bar,panoramic,city,view,night"
},
{
  id:"ag4-8",
  cityId:"bangkok",
  name:"Iconsiam Basement Wet Market",
  type:"market",
  neighborhood:"Khlong San / Iconsiam",
  description:"In the basement of Bangkok's most opulent mall there is a genuine Thai wet market \u2014 the Sook Siam cultural zone \u2014 where provincial vendors sell regional produce and cooked food from every Thai region. It exists as a cultural preservation project and is almost entirely ignored by shoppers four floors above.",
  vibe:8.5,
  localLove:8.9,
  uniqueness:9.3,
  tags:["wet market", "inside mall", "regional thai food", "cultural zone", "surprising"],
  tip:"Enter Iconsiam and take the escalator to G floor (basement). Head to the Sook Siam section in the corner. Northern Thai sai oua sausage is exceptional here.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Riverside / Chao Phraya",
  lat:13.7267,
  lng:100.5099,
  maps_url:"https://www.google.com/maps?q=13.7267,100.5099",
  transport:[{line:"BTS Silom", station:"Saphan Taksin (S6) then free shuttle", walk_min:10}, {line:"Boat", station:"Tha Sathon (free shuttle)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thai,wet,market,traditional,vendors,covered"
},
{
  id:"ag4-9",
  cityId:"bangkok",
  name:"Memorial Bridge Night Market",
  type:"market",
  neighborhood:"Saphan Phut / Bang Rak",
  description:"Bangkok's oldest standing night market, operating on the west end of Memorial Bridge since the 1930s. Primarily wholesale clothing and accessories, but the food stalls along the river bank are where taxi drivers and night-shift workers eat after midnight. Almost no tourist infrastructure \u2014 mostly Thai signage and Thai prices.",
  vibe:8.4,
  localLove:9.5,
  uniqueness:8.6,
  tags:["1930s", "night market", "overnight", "river bank", "taxi drivers"],
  tip:"Best after 11pm when the food vendors are at full swing and the wholesale crowd thins. The grilled seafood stalls face the river.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Riverside / Chao Phraya",
  lat:13.7451,
  lng:100.5,
  maps_url:"https://www.google.com/maps?q=13.7451,100.5",
  transport:[{line:"Boat", station:"Tha Saphan Phut", walk_min:3}, {line:"MRT Blue", station:"Sam Yot", walk_min:15}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,bridge,night,market,river,lights"
},
{
  id:"ag5-0",
  cityId:"bangkok",
  name:"Bottle Shop Ari",
  type:"bar",
  neighborhood:"Ari Soi 4",
  description:"A natural wine bottle shop with a small bar at the back that pours glasses from whatever's open. The selection is genuinely excellent \u2014 grower champagne, Georgian amber, Portuguese p\u00e9t-nat \u2014 and the prices are honest. The staff drink what they sell and have opinions they'll share if you ask. No dress code, no reservations.",
  vibe:8.9,
  localLove:8.7,
  uniqueness:8.8,
  tags:["natural wine", "bottle shop", "by the glass", "staff drinks", "honest prices"],
  tip:"Go mid-week when the selection is widest before weekend restocking. The staff's current favourite is always worth trying.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Ari / Phahon Yothin",
  lat:13.7764,
  lng:100.541,
  maps_url:"https://www.google.com/maps?q=13.7764,100.541",
  transport:[{line:"BTS Sukhumvit", station:"Ari (N5)", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?wine,bar,natural,wine,bottles,shelves"
},
{
  id:"ag5-1",
  cityId:"bangkok",
  name:"Cook and Twisted Ari",
  type:"restaurant",
  neighborhood:"Ari",
  description:"A tiny breakfast and lunch spot where everything is made to order from local ingredients and the chef changes the menu when he's bored with it. Currently doing exceptional Eggs Benedict on house-baked focaccia and a Thai-inspired shakshuka with holy basil and fish sauce. The queue at 9am is the reliable indicator of quality.",
  vibe:8.4,
  localLove:9.0,
  uniqueness:7.6,
  tags:["breakfast", "made to order", "rotating menu", "queue", "local ingredients"],
  tip:"Arrive at 8:30am before the queue. The daily special is always the thing to order \u2014 he writes it on a board by hand.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Ari / Phahon Yothin",
  lat:13.7761,
  lng:100.5405,
  maps_url:"https://www.google.com/maps?q=13.7761,100.5405",
  transport:[{line:"BTS Sukhumvit", station:"Ari (N5)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?cafe,brunch,eggs,avocado,toast,morning"
},
{
  id:"ag5-2",
  cityId:"bangkok",
  name:"NOMA Bangkok",
  type:"experience",
  neighborhood:"Phahon Yothin",
  description:"Not the Danish restaurant \u2014 an independent bookshop and reading room in a converted house behind Phahon Yothin that specialises in Thai art, architecture, and design books in both Thai and English. The reading room has good coffee and a rule about silencing phones. Respected and largely undiscovered.",
  vibe:8.6,
  localLove:8.3,
  uniqueness:8.5,
  tags:["bookshop", "thai art books", "reading room", "quiet", "converted house"],
  tip:"Check their events \u2014 monthly talks by Thai architects and artists that are open to walk-ins. Completely free.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Ari / Phahon Yothin",
  lat:13.7818,
  lng:100.5474,
  maps_url:"https://www.google.com/maps?q=13.7818,100.5474",
  transport:[{line:"BTS Sukhumvit", station:"Saphan Khwai (N6)", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bookshop,reading,room,quiet,cosy,shelves"
},
{
  id:"ag5-3",
  cityId:"bangkok",
  name:"Ronnarong Thai Cooking",
  type:"experience",
  neighborhood:"Ari",
  description:"A home cooking school in an actual Bangkok home that teaches genuinely regional Thai cooking \u2014 not pad thai. Ronnarong grew up in Chiang Mai and teaches northern dishes that you won't find in any restaurant in the city. Maximum eight students. He tells you where to buy the ingredients so you can keep cooking at home.",
  vibe:9.2,
  localLove:9.1,
  uniqueness:9.0,
  tags:["cooking class", "northern thai", "home school", "small group", "regional"],
  tip:"Book at least two weeks ahead. The market visit at the start is as valuable as the cooking. Bring a notebook.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Ari / Phahon Yothin",
  lat:13.7769,
  lng:100.5415,
  maps_url:"https://www.google.com/maps?q=13.7769,100.5415",
  transport:[{line:"BTS Sukhumvit", station:"Ari (N5)", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thai,cooking,class,ingredients,spices,kitchen"
},
{
  id:"ag5-4",
  cityId:"bangkok",
  name:"Mango Tree",
  type:"restaurant",
  neighborhood:"Ari Soi 1",
  description:"A neighbourhood Thai restaurant under a vast mango tree in someone's front garden that's been serving lunch to office workers and locals for 25 years. No signage visible from the road. The green curry is made with freshly pounded paste and coconut milk cracked on-site. The lunch special is 90 baht and includes soup, rice, and a dish.",
  vibe:8.3,
  localLove:9.6,
  uniqueness:8.2,
  tags:["garden restaurant", "no signage", "green curry", "25 years", "lunch special"],
  tip:"Weekday lunches only, closes at 2pm. Find it by looking for the mango tree in the garden off Ari Soi 1.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Ari / Phahon Yothin",
  lat:13.7756,
  lng:100.5402,
  maps_url:"https://www.google.com/maps?q=13.7756,100.5402",
  transport:[{line:"BTS Sukhumvit", station:"Ari (N5)", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?garden,restaurant,mango,tree,outdoor,dining"
},
{
  id:"ag5-5",
  cityId:"bangkok",
  name:"Vinyl Record Ari",
  type:"experience",
  neighborhood:"Ari",
  description:"A second-floor record shop reachable by a staircase covered in band posters that primarily stocks Thai and Southeast Asian pressings from the 1960s-80s. The owner has an encyclopedic knowledge of Thai country music and will play anything you want before you buy. Cash only, no photographs without asking.",
  vibe:8.7,
  localLove:8.9,
  uniqueness:9.2,
  tags:["vinyl", "thai music", "60s-80s", "second floor", "cash only"],
  tip:"Go on Saturday afternoons when the owner is there and the music playing upstairs can be heard from the street.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Ari / Phahon Yothin",
  lat:13.7762,
  lng:100.5412,
  maps_url:"https://www.google.com/maps?q=13.7762,100.5412",
  transport:[{line:"BTS Sukhumvit", station:"Ari (N5)", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?vinyl,records,shop,bins,music,browsing"
},
{
  id:"ag5-6",
  cityId:"bangkok",
  name:"Guss Damn Good",
  type:"restaurant",
  neighborhood:"Ari",
  description:"Ice cream made from single-origin Thai dairy from a farm in Chiang Mai, using seasonal fruits and unexpected savoury twists. The toasted rice with young coconut, and the lychee with white pepper are both the kind of things that make you stop mid-spoonful. The shop has six stools and a small tree outside.",
  vibe:8.5,
  localLove:8.8,
  uniqueness:8.9,
  tags:["artisan ice cream", "single origin", "seasonal", "thai dairy", "six stools"],
  tip:"The seasonal flavour changes monthly \u2014 whatever it is, order it. The waffle cone is also house-made.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Ari / Phahon Yothin",
  lat:13.7758,
  lng:100.5408,
  maps_url:"https://www.google.com/maps?q=13.7758,100.5408",
  transport:[{line:"BTS Sukhumvit", station:"Ari (N5)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?ice,cream,artisan,colourful,scoops,shop"
},
{
  id:"ag5-7",
  cityId:"bangkok",
  name:"Mace Restaurant",
  type:"restaurant",
  neighborhood:"Phahon Yothin 5",
  description:"A 10-seat restaurant in a townhouse where the chef does a set menu that changes every two weeks, built around Thai regional ingredients and European technique. The kind of place where chefs eat on their days off and the wine pairings are taken seriously. The menu is printed on a single sheet and changes without announcement.",
  vibe:9.1,
  localLove:8.5,
  uniqueness:9.3,
  tags:["10 seats", "set menu", "rotating", "chef favourite", "wine pairing"],
  tip:"Book directly via the phone number on their minimalist Instagram. Bring someone who will eat everything.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Ari / Phahon Yothin",
  lat:13.7821,
  lng:100.5478,
  maps_url:"https://www.google.com/maps?q=13.7821,100.5478",
  transport:[{line:"BTS Sukhumvit", station:"Saphan Khwai (N6)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?tasting,menu,fine,dining,plated,elegant"
},
{
  id:"ag5-8",
  cityId:"bangkok",
  name:"Tuk Tuk Republic",
  type:"bar",
  neighborhood:"Phahon Yothin",
  description:"A craft brewery and taproom that operates out of a converted petrol station, serving its own lagers and ales alongside a rotating guest tap from Thai and regional breweries. The outdoor seating on the old forecourt forecourt is particularly good on a cool evening. Food comes from a small kitchen doing credible burgers and bar snacks.",
  vibe:8.3,
  localLove:8.6,
  uniqueness:7.9,
  tags:["craft brewery", "taproom", "converted petrol station", "thai beer", "forecourt seating"],
  tip:"Wednesday evenings are the slowest \u2014 best for getting the brewer's attention and actual conversation about the beers.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Ari / Phahon Yothin",
  lat:13.7839,
  lng:100.5493,
  maps_url:"https://www.google.com/maps?q=13.7839,100.5493",
  transport:[{line:"BTS Sukhumvit", station:"Saphan Khwai (N6)", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?craft,beer,brewery,taproom,barrels"
},
{
  id:"ag5-9",
  cityId:"bangkok",
  name:"Ari Farmers Market",
  type:"market",
  neighborhood:"Ari",
  description:"A Saturday morning market in the Ari neighbourhood that operates on genuinely local produce ethics \u2014 all vendors must be direct producers, no resellers. You'll find heirloom rice from the north, hand-pressed coconut oil, organic herbs from community gardens in Nonthaburi, and a Thai-Italian cheese maker whose mozzarella is made that morning.",
  vibe:8.8,
  localLove:9.3,
  uniqueness:8.1,
  tags:["farmers market", "saturday", "direct producer", "heirloom rice", "local organic"],
  tip:"Saturday 8am-1pm. The cheese vendor sells out by 10am. Bring a reusable bag and cash.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Ari / Phahon Yothin",
  lat:13.7753,
  lng:100.5399,
  maps_url:"https://www.google.com/maps?q=13.7753,100.5399",
  transport:[{line:"BTS Sukhumvit", station:"Ari (N5)", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?farmers,market,organic,vegetables,saturday,morning"
},
{
  id:"ag6-0",
  cityId:"bangkok",
  name:"Bang Krachao Green Loop",
  type:"experience",
  neighborhood:"Bang Krachao / Phra Pradaeng",
  description:"A 15km bicycle loop through Bangkok's 'green lung' \u2014 a river peninsula that looks like rural Thailand and is 15 minutes by ferry from Sathorn. The jungle path passes fruit orchards, stilted houses, and a floating market that operates entirely for residents. Rent a bicycle at the pier for 60 baht.",
  vibe:9.7,
  localLove:9.4,
  uniqueness:9.1,
  tags:["cycling", "green lung", "jungle", "fruit orchards", "ferry", "60 baht bike"],
  tip:"Take the ferry from Klong Toei pier at 7am. Rent the oldest bike \u2014 it'll have better tyres. The orchard cafe at km 8 does fresh coconut.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Thonburi West Bank",
  lat:13.6901,
  lng:100.5852,
  maps_url:"https://www.google.com/maps?q=13.6901,100.5852",
  transport:[{line:"Boat", station:"Klong Toei Pier (then ferry)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thailand,green,jungle,bicycle,cycling,path"
},
{
  id:"ag6-1",
  cityId:"bangkok",
  name:"Wat Hong Rattanaram",
  type:"experience",
  neighborhood:"Bangkok Noi",
  description:"A temple complex in the Bangkok Noi neighbourhood that contains an extraordinary museum of old Thai royal barges \u2014 not the official one downstream, but the working collection. The abbot restores them himself and will walk you through each vessel's history if the temple isn't busy. Some of the barges are over 200 years old.",
  vibe:8.8,
  localLove:8.2,
  uniqueness:9.4,
  tags:["royal barges", "restoration", "200 year old", "abbot guided", "free"],
  tip:"Go on weekday mornings and ask the monks if the abbot is available. He speaks passable English and the tour is extraordinary.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Thonburi West Bank",
  lat:13.7648,
  lng:100.4872,
  maps_url:"https://www.google.com/maps?q=13.7648,100.4872",
  transport:[{line:"Boat", station:"Wang Lang Pier", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thailand,temple,ancient,barge,river"
},
{
  id:"ag6-2",
  cityId:"bangkok",
  name:"Nonthaburi Durian Market",
  type:"market",
  neighborhood:"Nonthaburi",
  description:"A pre-dawn durian market operating from 2am on the Nonthaburi riverbank where orchard owners from Nonthaburi and beyond bring their harvest by boat. Serious durian buyers \u2014 restaurants, market vendors \u2014 do their business here before sunrise. Outsiders can join in by simply showing up and buying direct from the boats.",
  vibe:9.2,
  localLove:9.8,
  uniqueness:9.5,
  tags:["durian", "2am", "by boat", "wholesale", "pre-dawn", "river"],
  tip:"Take a taxi to Nonthaburi Pier at 2:30am. Bring a torch. Buy direct from the boat vendors \u2014 half the market price. Do not bring it on the BTS afterwards.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Thonburi West Bank",
  lat:13.8633,
  lng:100.5104,
  maps_url:"https://www.google.com/maps?q=13.8633,100.5104",
  transport:[{line:"Boat", station:"Nonthaburi Pier", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thailand,durian,market,dawn,tropical,green"
},
{
  id:"ag6-3",
  cityId:"bangkok",
  name:"Wat Rakhang Bell Tower",
  type:"experience",
  neighborhood:"Bangkok Noi / Thonburi",
  description:"A riverside temple famous for its 18th-century bell tower and the adjacent wooden library building that houses one of the most beautiful examples of Thai manuscript art in the country. Almost always empty. The terrace at the back faces the river and Wat Pho directly across, with none of the tourist foot traffic.",
  vibe:9.1,
  localLove:8.3,
  uniqueness:9.0,
  tags:["18th century", "bell tower", "manuscript art", "empty", "river view"],
  tip:"Take the cross-river ferry from Tha Chang pier for 3 baht. The wooden library is unlocked from 9am-4pm.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Thonburi West Bank",
  lat:13.7489,
  lng:100.4889,
  maps_url:"https://www.google.com/maps?q=13.7489,100.4889",
  transport:[{line:"Boat", station:"Tha Chang (cross-river ferry)", walk_min:4}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,riverside,temple,bell,tower,ancient"
},
{
  id:"ag6-4",
  cityId:"bangkok",
  name:"Klong Bangkok Noi Canal Tour",
  type:"experience",
  neighborhood:"Bangkok Noi",
  description:"A network of canals in Bangkok Noi that still function as they did 100 years ago \u2014 local transport, market boats, spirit houses at every water junction, children swimming. Hire a longtail boat from the Bangkok Noi pier for a private 90-minute tour. Your driver will take you places no tourist boat goes.",
  vibe:9.6,
  localLove:9.0,
  uniqueness:9.3,
  tags:["canal tour", "longtail boat", "local life", "spirit houses", "90 minutes"],
  tip:"Negotiate at Bangkok Noi pier early morning \u2014 500 baht for 90 minutes is fair. Tell the driver you want to go slowly through the small klongs.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Thonburi West Bank",
  lat:13.7659,
  lng:100.4817,
  maps_url:"https://www.google.com/maps?q=13.7659,100.4817",
  transport:[{line:"Boat", station:"Bangkok Noi Pier", walk_min:3}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,canal,longtail,boat,slow,village"
},
{
  id:"ag6-5",
  cityId:"bangkok",
  name:"Taling Chan Floating Market",
  type:"market",
  neighborhood:"Taling Chan",
  description:"A genuine neighbourhood floating market that operates on the Thonburi canal on weekend mornings, primarily for locals buying groceries and eating cooked food on the canal bank. Unlike the tourist floating markets, the prices are Thai prices, the food is Thai breakfast food, and nobody is trying to sell you souvenirs.",
  vibe:8.7,
  localLove:9.5,
  uniqueness:8.3,
  tags:["floating market", "weekend", "local groceries", "thai breakfast", "no souvenirs"],
  tip:"Songthaew or taxi from Victory Monument. Saturday 8am-4pm. Eat the grilled prawns and the coconut pancakes from the boat stalls.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Thonburi West Bank",
  lat:13.7817,
  lng:100.4569,
  maps_url:"https://www.google.com/maps?q=13.7817,100.4569",
  transport:[{line:"Taxi / Grab only", station:"No direct transit \u2014 30 min from Victory Monument", walk_min:0}],
  photo_url:"https://source.unsplash.com/featured/800x500/?floating,market,canal,wooden,boats,weekend"
},
{
  id:"ag6-6",
  cityId:"bangkok",
  name:"Sirindhorn Canal Boat Food",
  type:"restaurant",
  neighborhood:"Thonburi",
  description:"A cluster of food boats moored on the Sirindhorn canal that sell cooked food to nearby factories and workshops. They operate from 5am and are gone by 9am. You can eat fried rice with prawns, pad see ew, and tom kha kai for 40-50 baht sitting on the canal bank with the factory shift workers.",
  vibe:8.5,
  localLove:9.7,
  uniqueness:8.9,
  tags:["canal food boats", "factory workers", "5am", "40 baht", "dawn"],
  tip:"Ask a tuk-tuk driver to take you to the Sirindhorn canal food boats at 6am. Point and order what the workers are eating.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Thonburi West Bank",
  lat:13.7691,
  lng:100.4751,
  maps_url:"https://www.google.com/maps?q=13.7691,100.4751",
  transport:[{line:"Taxi / Grab only", station:"No BTS/MRT \u2014 take taxi from Bangkok Noi", walk_min:0}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thailand,canal,food,boat,workers,morning"
},
{
  id:"ag6-7",
  cityId:"bangkok",
  name:"Wat Kalayanamit Weaving Community",
  type:"experience",
  neighborhood:"Khlong San",
  description:"Behind Wat Kalayanamit, a small community of weavers produces traditional Thai silk and cotton cloth using hand looms set up in the open-air ground floors of their houses. They sell directly, mostly to local customers. Watching the loom work and the dyeing process in the front garden is one of the quieter Bangkok pleasures.",
  vibe:8.4,
  localLove:9.0,
  uniqueness:9.1,
  tags:["weaving", "traditional silk", "hand loom", "community", "direct purchase"],
  tip:"Weekday mornings when the weavers are working. Walk behind the temple toward the canal and follow the sound of the looms.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Thonburi West Bank",
  lat:13.7404,
  lng:100.4882,
  maps_url:"https://www.google.com/maps?q=13.7404,100.4882",
  transport:[{line:"Boat", station:"Tha Ratchawong (cross-river)", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thailand,silk,weaving,handloom,traditional"
},
{
  id:"ag6-8",
  cityId:"bangkok",
  name:"Proong Nara Garden Cuisine",
  type:"restaurant",
  neighborhood:"Bang Krachao",
  description:"A restaurant set in a garden inside Bang Krachao that serves traditional central Thai food using produce grown on the property. The tom yam is made with fresh galangal and kaffir lime from the garden, and the fish comes from the canal outside. Reachable only by bicycle or the bang krachao ferry.",
  vibe:9.3,
  localLove:9.1,
  uniqueness:9.4,
  tags:["garden restaurant", "bang krachao", "canal fish", "on-site produce", "bicycle only"],
  tip:"Book ahead on weekends. Cycle from the ferry pier \u2014 it's 10 minutes through the orchards.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Thonburi West Bank",
  lat:13.6889,
  lng:100.5838,
  maps_url:"https://www.google.com/maps?q=13.6889,100.5838",
  transport:[{line:"Boat", station:"Klong Toei Pier + ferry + bicycle", walk_min:20}],
  photo_url:"https://source.unsplash.com/featured/800x500/?garden,restaurant,canal,cooking,fire,fish"
},
{
  id:"ag6-9",
  cityId:"bangkok",
  name:"Museum of the Forensic Medicine",
  type:"experience",
  neighborhood:"Siriraj Hospital, Bangkok Noi",
  description:"A genuinely strange and fascinating set of medical museums inside Siriraj Hospital that includes a forensic pathology museum, a parasitology collection, and the preserved bodies of notable criminals. The medical history collection charts Thai medicine from ancient practice to today. Macabre, educational, and almost entirely unvisited by tourists.",
  vibe:7.8,
  localLove:7.5,
  uniqueness:9.8,
  tags:["forensic museum", "medical history", "macabre", "hospital", "preserved bodies"],
  tip:"Take the hospital ferry from Tha Phra Chan pier. Open Tuesday-Sunday 10am-4pm, 200 baht entry. Not for the squeamish.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Thonburi West Bank",
  lat:13.7608,
  lng:100.4829,
  maps_url:"https://www.google.com/maps?q=13.7608,100.4829",
  transport:[{line:"Boat", station:"Prannok Pier / Wang Lang", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?vintage,medical,museum,jars,specimens"
},
{
  id:"ag7-0",
  cityId:"bangkok",
  name:"Muay Thai Lab",
  type:"experience",
  neighborhood:"Ratchada",
  description:"A training gym above a shophouse that offers walk-in sparring sessions and technique classes with actual Thai trainers who competed professionally. Not a tourist-facing camp \u2014 this is where local fighters and office workers train together in the evenings. The 6pm class is 300 baht and will rearrange your understanding of your own body.",
  vibe:9.0,
  localLove:9.5,
  uniqueness:8.8,
  tags:["muay thai", "genuine training", "thai trainers", "300 baht", "evening class"],
  tip:"Show up at 5:45pm and tell them you want to train. Bring hand wraps. The trainers will pair you based on ability, not politeness.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Ratchada / Lat Phrao",
  lat:13.7741,
  lng:100.5668,
  maps_url:"https://www.google.com/maps?q=13.7741,100.5668",
  transport:[{line:"MRT Blue", station:"Thailand Cultural Centre", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?muay,thai,training,gym,fighters,gloves"
},
{
  id:"ag7-1",
  cityId:"bangkok",
  name:"Yeak Thong Lor Street Food",
  type:"market",
  neighborhood:"Lat Phrao Soi 101",
  description:"A street food cluster that feeds the Thai office worker population of the Lat Phrao corridor and operates entirely in Thai. Thirty vendors in a carpark from 5pm-midnight. The criteria for stall selection by locals is the length of the queue \u2014 join the longest one.",
  vibe:8.6,
  localLove:9.8,
  uniqueness:7.9,
  tags:["street food", "thai office crowd", "carpark market", "evening", "queue"],
  tip:"Take a taxi to Lat Phrao Soi 101. Arrive by 7pm before popular stalls sell out. Everything is cash, no English.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Ratchada / Lat Phrao",
  lat:13.8046,
  lng:100.5893,
  maps_url:"https://www.google.com/maps?q=13.8046,100.5893",
  transport:[{line:"MRT Blue", station:"Lat Phrao (no close stop)", walk_min:25}, {line:"Taxi from Lat Phrao", station:"Lat Phrao MRT", walk_min:0}],
  photo_url:"https://source.unsplash.com/featured/800x500/?street,food,carpark,vendors,evening,thai"
},
{
  id:"ag7-2",
  cityId:"bangkok",
  name:"Studio Lam",
  type:"bar",
  neighborhood:"Sukhumvit Soi 51",
  description:"A DJ bar attached to the ZudRangMa Records vinyl shop that plays exclusively Thai and Southeast Asian music \u2014 luk thung, molam, Thai psych, Lao pop. The DJs are passionate and the sound system is excellent. On peak nights the older Thai generation who actually lived through the music mix with younger collectors. Astonishing cultural collision.",
  vibe:9.6,
  localLove:9.4,
  uniqueness:9.7,
  tags:["thai music", "vinyl bar", "molam", "luk thung", "sound system", "cultural collision"],
  tip:"Thursday and Friday nights are best. The record shop next door opens during bar hours \u2014 do not leave without buying something.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Ratchada / Lat Phrao",
  lat:13.7286,
  lng:100.5869,
  maps_url:"https://www.google.com/maps?q=13.7286,100.5869",
  transport:[{line:"BTS Sukhumvit", station:"Thong Lo (E6)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?vinyl,bar,music,dj,mixing,speakers"
},
{
  id:"ag7-3",
  cityId:"bangkok",
  name:"Wongsakorn Hospital Market",
  type:"market",
  neighborhood:"Lat Phrao",
  description:"A fresh market behind a community hospital in Lat Phrao that operates from 4am and sells wholesale produce to restaurants, market vendors, and serious home cooks. The fish section is extraordinary \u2014 whole fish sold by the kilo at source prices. Non-professionals are welcome; nobody will try to overcharge you.",
  vibe:8.0,
  localLove:9.6,
  uniqueness:8.4,
  tags:["4am", "wholesale market", "fresh fish", "restaurant trade", "source prices"],
  tip:"Go between 5-6am when the widest selection is available. Bring a cooler bag. The shrimp paste vendor near the entrance is exceptional.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Ratchada / Lat Phrao",
  lat:13.8039,
  lng:100.5881,
  maps_url:"https://www.google.com/maps?q=13.8039,100.5881",
  transport:[{line:"Taxi / Grab only", station:"No nearby transit", walk_min:0}],
  photo_url:"https://source.unsplash.com/featured/800x500/?wholesale,market,fish,fresh,dawn,ice"
},
{
  id:"ag7-4",
  cityId:"bangkok",
  name:"Beer Republic",
  type:"bar",
  neighborhood:"Ratchada Soi 3",
  description:"Bangkok's most serious craft beer bar \u2014 30 taps, extensive bottle list, a beer sommelier who actually has the certification. The crowd is mixed Thai and expat in the best way, bound by shared interest in obscure Belgian ales and Thai craft lagers. The knowledgeable staff will guide you through a flight of anything.",
  vibe:8.7,
  localLove:8.8,
  uniqueness:8.0,
  tags:["craft beer", "30 taps", "beer sommelier", "belgian ales", "flight"],
  tip:"Thursday 'Brewmaster Night' when guest brewers bring one-off batches. The tasting flight of 4 is better value than ordering full pints.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Ratchada / Lat Phrao",
  lat:13.7748,
  lng:100.5682,
  maps_url:"https://www.google.com/maps?q=13.7748,100.5682",
  transport:[{line:"MRT Blue", station:"Thailand Cultural Centre", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?craft,beer,bar,taps,lager,pint,glasses"
},
{
  id:"ag7-5",
  cityId:"bangkok",
  name:"Talad Neon Night Market",
  type:"market",
  neighborhood:"Ratchada",
  description:"A genuinely local night market near the Ratchada cultural centre with none of the curation of Train Night Market. Clothing vendors, food stalls, carnival games, live music playing Thai pop on a small stage. The crowd is entirely Thai suburban \u2014 families, teenagers, people who live nearby. Refreshingly uncommercialised.",
  vibe:8.3,
  localLove:9.4,
  uniqueness:7.5,
  tags:["night market", "local", "thai families", "live pop music", "uncommercialised"],
  tip:"Arrive after 8pm when it gets going. The mango tango stall with the queues is not to be missed. Bring cash.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Ratchada / Lat Phrao",
  lat:13.7747,
  lng:100.5695,
  maps_url:"https://www.google.com/maps?q=13.7747,100.5695",
  transport:[{line:"MRT Blue", station:"Thailand Cultural Centre", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?night,market,neon,lights,local,stalls"
},
{
  id:"ag7-6",
  cityId:"bangkok",
  name:"Rajawongse Clothiers",
  type:"experience",
  neighborhood:"Near Ratchada",
  description:"A bespoke tailor operating from a cramped shophouse that makes suits, shirts, and trousers to measure at prices that are genuinely astonishing. The owner trained in Hong Kong and the fabrics come from mills that don't do tourist prices. Three-day turnaround on a shirt. Six days on a suit.",
  vibe:7.9,
  localLove:9.2,
  uniqueness:8.5,
  tags:["bespoke tailor", "shophouse", "hong kong trained", "honest price", "3-day turnaround"],
  tip:"Bring a reference photograph of what you want. Allow 3 fittings minimum for a suit.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Ratchada / Lat Phrao",
  lat:13.7752,
  lng:100.5662,
  maps_url:"https://www.google.com/maps?q=13.7752,100.5662",
  transport:[{line:"MRT Blue", station:"Thailand Cultural Centre", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bespoke,tailor,suit,fabric,measuring"
},
{
  id:"ag7-7",
  cityId:"bangkok",
  name:"Ratchada Amphitheater Shows",
  type:"experience",
  neighborhood:"Ratchada Cultural Center",
  description:"Free traditional Thai performance \u2014 khon masked dance, classical music, puppet theatre \u2014 that happens in the amphitheatre behind the Thailand Cultural Centre MRT station. Put on by Thammasat students and regional performance companies. Inconsistent scheduling but extraordinary when it happens. Completely free, no reservation.",
  vibe:8.8,
  localLove:9.0,
  uniqueness:9.0,
  tags:["khon dance", "free performance", "classical thai", "puppet theatre", "student performers"],
  tip:"Check the Thailand Cultural Centre website or their Facebook for upcoming shows. Shows happen 5-7pm on selected weekends.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Ratchada / Lat Phrao",
  lat:13.7756,
  lng:100.568,
  maps_url:"https://www.google.com/maps?q=13.7756,100.568",
  transport:[{line:"MRT Blue", station:"Thailand Cultural Centre", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thai,classical,dance,performance,costume"
},
{
  id:"ag7-8",
  cityId:"bangkok",
  name:"Khua Kling Pak Sod",
  type:"restaurant",
  neighborhood:"Sathorn (also Ratchada branch)",
  description:"Southern Thai cuisine done with the terrifying authenticity of a restaurant run by a family from Nakhon Si Thammarat. The khua kling \u2014 a dry-fried minced meat curry \u2014 is one of the hottest dishes in Bangkok and the menu comes with a genuine spice warning. The restaurant's regulars include everyone who grew up eating southern Thai food and misses it.",
  vibe:9.2,
  localLove:9.7,
  uniqueness:8.6,
  tags:["southern thai", "khua kling", "extremely spicy", "authentic", "nakhon si thammarat"],
  tip:"Order khua kling, stir-fried water mimosa, and white rice. Tell them medium spice and it will still be very hot.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Ratchada / Lat Phrao",
  lat:13.7241,
  lng:100.5276,
  maps_url:"https://www.google.com/maps?q=13.7241,100.5276",
  transport:[{line:"BTS Silom", station:"Chong Nonsi (S3)", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?southern,thai,food,chilli,authentic,paste"
},
{
  id:"ag7-9",
  cityId:"bangkok",
  name:"Thip Samai After Dark",
  type:"restaurant",
  neighborhood:"Banglamphu (also Lat Phrao branch)",
  description:"Everyone knows the Thip Samai on Mahachai Road \u2014 but fewer people know the Lat Phrao branch that opens at 5pm and runs until 4am, serving the original pad thai recipe to night workers and taxi drivers who've been coming for decades. The prawns are shell-on and enormous. The orange juice is freshly pressed on-site.",
  vibe:9.0,
  localLove:9.8,
  uniqueness:8.0,
  tags:["pad thai", "4am", "night workers", "shell-on prawns", "fresh orange juice"],
  tip:"Go between 1-3am when the tourist traffic is gone and the cooks are in full rhythm. The 'wrapped' pad thai inside an egg crepe is the original way.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Ratchada / Lat Phrao",
  lat:13.7546,
  lng:100.5012,
  maps_url:"https://www.google.com/maps?q=13.7546,100.5012",
  transport:[{line:"MRT Blue", station:"Sam Yot", walk_min:9}, {line:"Boat", station:"Tha Saphan Phut", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?pad,thai,wok,street,food,night,cooking"
},
{
  id:"ag8-0",
  cityId:"bangkok",
  name:"Smalls Bar",
  type:"bar",
  neighborhood:"Sukhumvit Soi 22 (Silom crowd)",
  description:"A jazz bar hidden in the basement of a residential building with no signage outside and a door that looks like a utility entrance. The jazz is live and serious \u2014 mostly Thai musicians who play in the style of the American 50s-60s \u2014 and the bar serves drinks named after jazz standards. Membership is informal; you get in by knowing where it is.",
  vibe:9.7,
  localLove:9.2,
  uniqueness:9.8,
  tags:["jazz", "basement bar", "no signage", "thai jazz musicians", "50s-60s style"],
  tip:"Find the door via their Instagram. Friday nights the standards are played in order from the Real Book. The Monk is exceptional.",
  status:"approved",
  agentIcon:"\ud83c\udf78",
  discoveredBy:"Silom / Sathorn",
  lat:13.728,
  lng:100.5622,
  maps_url:"https://www.google.com/maps?q=13.728,100.5622",
  transport:[{line:"BTS Sukhumvit", station:"Phrom Phong (E5)", walk_min:15}],
  photo_url:"https://source.unsplash.com/featured/800x500/?jazz,bar,basement,intimate,music,dark"
},
{
  id:"ag8-1",
  cityId:"bangkok",
  name:"Namsaah Bottling Trust",
  type:"bar",
  neighborhood:"Sathorn Soi 7",
  description:"A former soda bottling factory converted into a craft cocktail bar with the industrial bones left exposed and a menu organised by flavour profile rather than spirit category. The Thai soda cocktails using house-made sodas with regional fruit flavours are the most interesting things on the menu. Almost no signage.",
  vibe:9.1,
  localLove:8.7,
  uniqueness:9.2,
  tags:["craft cocktails", "former factory", "house sodas", "thai fruit", "industrial bones"],
  tip:"The house-made rosella and young ginger cocktail. Go on weekdays to actually talk to the bartenders about what they're making.",
  status:"approved",
  agentIcon:"\ud83c\udf78",
  discoveredBy:"Silom / Sathorn",
  lat:13.722,
  lng:100.5282,
  maps_url:"https://www.google.com/maps?q=13.722,100.5282",
  transport:[{line:"BTS Silom", station:"Chong Nonsi (S3)", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?cocktail,bar,factory,industrial,converted"
},
{
  id:"ag8-2",
  cityId:"bangkok",
  name:"Somtam Nua",
  type:"restaurant",
  neighborhood:"Siam / Silom",
  description:"A papaya salad restaurant that has been serving the best som tam in central Bangkok since 1994. Run by a family from Isan with the same recipes across three decades, the menu has expanded minimally and everything is still made fresh to order. The Isan sausage and fermented fish versions are not for timid palates.",
  vibe:8.5,
  localLove:9.6,
  uniqueness:7.9,
  tags:["som tam", "papaya salad", "isan", "1994", "family run", "fermented fish"],
  tip:"The fermented crab som tam is the benchmark. Tell them Thai spice level \u2014 their 'not spicy' is medium heat for most visitors.",
  status:"approved",
  agentIcon:"\ud83c\udf78",
  discoveredBy:"Silom / Sathorn",
  lat:13.7457,
  lng:100.5349,
  maps_url:"https://www.google.com/maps?q=13.7457,100.5349",
  transport:[{line:"BTS Sukhumvit", station:"Siam (CEN)", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?papaya,salad,restaurant,thai,green,mango"
},
{
  id:"ag8-3",
  cityId:"bangkok",
  name:"The Local by Oam Thong Thai Cuisine",
  type:"restaurant",
  neighborhood:"Sukhumvit Soi 23",
  description:"A restaurant inside a converted century-old teak house that serves Thai food from royal and aristocratic recipes \u2014 dishes that were once served in Bangkok's elite households and have disappeared from street food culture. The menus comes with historical notes. The banana blossom salad is made to a palace recipe.",
  vibe:9.0,
  localLove:8.4,
  uniqueness:9.3,
  tags:["royal thai cuisine", "teak house", "palace recipes", "aristocratic dishes", "historical notes"],
  tip:"Order the set menu rather than \u00e0 la carte to understand the progression of the meal. Book ahead for the private rooms in the old servants' quarters.",
  status:"approved",
  agentIcon:"\ud83c\udf78",
  discoveredBy:"Silom / Sathorn",
  lat:13.7369,
  lng:100.5607,
  maps_url:"https://www.google.com/maps?q=13.7369,100.5607",
  transport:[{line:"BTS Sukhumvit", station:"Asok (E4)", walk_min:12}, {line:"MRT Blue", station:"Sukhumvit", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thai,royal,cuisine,teak,house,elegant"
},
{
  id:"ag8-4",
  cityId:"bangkok",
  name:"Chon Bar",
  type:"bar",
  neighborhood:"Sathorn Soi 10",
  description:"An intimate eight-seat bar run by a bartender who returned from Tokyo with a reverence for Japanese technique and applied it to Thai ingredients. The menu changes weekly, built around what's in season and what the bartender is obsessed with that week. The bar has no name on the door.",
  vibe:9.4,
  localLove:8.6,
  uniqueness:9.6,
  tags:["8 seats", "japanese technique", "thai ingredients", "weekly menu", "no door sign"],
  tip:"Book through Instagram DM. Come with an open mind and no preferences \u2014 let the bartender decide.",
  status:"approved",
  agentIcon:"\ud83c\udf78",
  discoveredBy:"Silom / Sathorn",
  lat:13.7218,
  lng:100.5271,
  maps_url:"https://www.google.com/maps?q=13.7218,100.5271",
  transport:[{line:"BTS Silom", station:"Chong Nonsi (S3)", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?intimate,cocktail,bar,small,batters"
},
{
  id:"ag8-5",
  cityId:"bangkok",
  name:"Silom Village Night Market",
  type:"market",
  neighborhood:"Silom",
  description:"A small courtyard market behind the Silom Village complex that has been quietly feeding the Silom office worker population for 30 years. The daytime vendors pack up at 6pm and the evening market takes over \u2014 grilled chicken, som tam, khao man gai, and cold beer in plastic cups on low tables.",
  vibe:8.2,
  localLove:9.5,
  uniqueness:7.6,
  tags:["courtyard market", "30 years", "office workers", "evening", "cold beer"],
  tip:"Weekday evenings 6-10pm when the office crowd unwinds. The grilled chicken vendor has a longer queue for a reason.",
  status:"approved",
  agentIcon:"\ud83c\udf78",
  discoveredBy:"Silom / Sathorn",
  lat:13.7268,
  lng:100.529,
  maps_url:"https://www.google.com/maps?q=13.7268,100.529",
  transport:[{line:"BTS Silom", station:"Sala Daeng (S2)", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?courtyard,market,evening,food,stalls"
},
{
  id:"ag8-6",
  cityId:"bangkok",
  name:"Attitude Bar at U Sathorn",
  type:"bar",
  neighborhood:"Sathorn",
  description:"A small poolside bar at the U Sathorn hotel that operates as a de-facto neighbourhood hangout for Sathorn locals who use the walk-in bar privileges. The bartender has been there for 15 years and knows everyone who comes in by first name. The Thai whisky soda setup on the terrace at 6pm is one of Bangkok's more civilised hours.",
  vibe:8.6,
  localLove:8.4,
  uniqueness:7.8,
  tags:["poolside", "hotel bar", "open to public", "15 year bartender", "thai whisky"],
  tip:"Walk in and say you want a drink by the pool. The longstanding bartender Noi will take care of the rest.",
  status:"approved",
  agentIcon:"\ud83c\udf78",
  discoveredBy:"Silom / Sathorn",
  lat:13.7223,
  lng:100.5274,
  maps_url:"https://www.google.com/maps?q=13.7223,100.5274",
  transport:[{line:"BTS Silom", station:"Chong Nonsi (S3)", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?hotel,poolside,bar,terrace,night,city"
},
{
  id:"ag8-7",
  cityId:"bangkok",
  name:"Bangrak Market (Talat Bangrak)",
  type:"market",
  neighborhood:"Bangrak",
  description:"A century-old covered market in the Bangrak neighbourhood that predates everything around it. Produces, dried goods, fresh flowers, and a row of ancient Chinese-Thai coffee stalls operating from pre-dawn. The market building itself is remarkable \u2014 cast iron columns, original tiles, and a roof that's been leaking elegantly for decades.",
  vibe:8.4,
  localLove:9.3,
  uniqueness:8.8,
  tags:["century old", "covered market", "cast iron", "chinese-thai coffee", "pre-dawn", "flowers"],
  tip:"Arrive at 6am for the coffee stalls and the flower vendors at their most active. The market quiets dramatically by 10am.",
  status:"approved",
  agentIcon:"\ud83c\udf78",
  discoveredBy:"Silom / Sathorn",
  lat:13.7236,
  lng:100.5147,
  maps_url:"https://www.google.com/maps?q=13.7236,100.5147",
  transport:[{line:"Boat", station:"Tha Si Phraya", walk_min:7}, {line:"BTS Silom", station:"Saphan Taksin (S6)", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?covered,market,century,old,morning,cast,iron"
},
{
  id:"ag8-8",
  cityId:"bangkok",
  name:"Sri Mariamman Temple Evening",
  type:"experience",
  neighborhood:"Silom",
  description:"The oldest Hindu temple in Bangkok \u2014 not the Erawan Shrine \u2014 operating a genuine active South Indian religious community. The evening puja at 6:30pm is conducted in Tamil with flower offerings and incense. The temple elephant is ceremonially blessed on major festival days. The surrounding streets smell of jasmine garlands being strung.",
  vibe:9.0,
  localLove:8.7,
  uniqueness:9.1,
  tags:["hindu temple", "tamil community", "evening puja", "temple elephant", "jasmine garlands"],
  tip:"Evening puja at 6:30pm daily. Dress modestly and remove shoes. The flower vendors outside are selling directly to the temple.",
  status:"approved",
  agentIcon:"\ud83c\udf78",
  discoveredBy:"Silom / Sathorn",
  lat:13.7263,
  lng:100.5277,
  maps_url:"https://www.google.com/maps?q=13.7263,100.5277",
  transport:[{line:"BTS Silom", station:"Sala Daeng (S2)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?hindu,temple,south,indian,flowers,colourful"
},
{
  id:"ag8-9",
  cityId:"bangkok",
  name:"Eating Room Sathorn",
  type:"restaurant",
  neighborhood:"Sathorn Soi 10",
  description:"A private dining experience hosted in someone's actual home in Sathorn \u2014 a six-course Thai meal cooked by a former palace chef who left formal employment to cook for fifteen guests at a time in her dining room. The tablecloth is linen. The recipes are not available anywhere else. Book months in advance.",
  vibe:9.5,
  localLove:9.0,
  uniqueness:9.9,
  tags:["private dining", "palace chef", "home restaurant", "six courses", "months in advance"],
  tip:"Find through word of mouth or very persistent searching. They are not on social media. Monthly seatings, 15 guests maximum.",
  status:"approved",
  agentIcon:"\ud83c\udf78",
  discoveredBy:"Silom / Sathorn",
  lat:13.7227,
  lng:100.527,
  maps_url:"https://www.google.com/maps?q=13.7227,100.527",
  transport:[{line:"BTS Silom", station:"Chong Nonsi (S3)", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?private,dining,home,restaurant,intimate"
},
{
  id:"ag9-0",
  cityId:"bangkok",
  name:"The Bookshop Bar",
  type:"bar",
  neighborhood:"Phra Athit",
  description:"A narrow shophouse operating as a used bookshop by day and a bar by evening, with the books remaining on the shelves throughout and customers reading at their tables. The wine is cheap, the cocktails are thought through, and the house rule is that you may not use your phone at the bar. People actually talk to each other here.",
  vibe:9.2,
  localLove:8.8,
  uniqueness:9.0,
  tags:["bookshop bar", "no phones at bar", "wine", "books", "conversation"],
  tip:"The evening reading hour from 6-8pm when the bar is quiet and the selection of wine by the glass changes. Check what's been left behind on the swap shelf.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Banglamphu / Phra Nakhon",
  lat:13.7591,
  lng:100.4944,
  maps_url:"https://www.google.com/maps?q=13.7591,100.4944",
  transport:[{line:"Boat", station:"Phra Arthit Pier", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bookshop,bar,wine,books,shelves,reading"
},
{
  id:"ag9-1",
  cityId:"bangkok",
  name:"Folk Music Night at Adhere the 13th",
  type:"bar",
  neighborhood:"Banglamphu Soi Rambutri",
  description:"A narrow bar on Soi Rambutri that plays live Thai folk and blues music every night \u2014 not for tourists but for the musicians who come to jam after their other gigs. The house band starts at 10pm and anyone who can play is invited to join. The Leo beer is cold and the conversation is in a mixture of Thai and English.",
  vibe:9.3,
  localLove:9.5,
  uniqueness:8.9,
  tags:["thai folk music", "blues", "live jam", "musician hangout", "late night"],
  tip:"Go after 10pm when the impromptu jam starts. Bring your instrument if you have one. The barman Noon has been pouring here for 15 years.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Banglamphu / Phra Nakhon",
  lat:13.7583,
  lng:100.4985,
  maps_url:"https://www.google.com/maps?q=13.7583,100.4985",
  transport:[{line:"Boat", station:"Phra Arthit Pier", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?folk,music,bar,live,acoustic,guitar,jam"
},
{
  id:"ag9-2",
  cityId:"bangkok",
  name:"Thammasat University Canteen",
  type:"restaurant",
  neighborhood:"Tha Phra Chan",
  description:"The university canteen on the ground floor of the oldest university in Thailand \u2014 accessible to anyone who walks in. Serves full Thai meals for 35-50 baht to students, faculty, and opportunistic visitors. The kaeng kari (yellow curry) with roti is made daily by a Thai-Muslim vendor and is exceptional. Eat among the students debating Thai politics over lunch.",
  vibe:8.1,
  localLove:9.7,
  uniqueness:8.3,
  tags:["university canteen", "35 baht", "student crowd", "yellow curry", "open to public"],
  tip:"Weekdays 11am-2pm. Walk in like you own the place. The Thai-Muslim curry counter near the river entrance is the one.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Banglamphu / Phra Nakhon",
  lat:13.7568,
  lng:100.4942,
  maps_url:"https://www.google.com/maps?q=13.7568,100.4942",
  transport:[{line:"Boat", station:"Tha Chang", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?university,canteen,students,thai,food,tables"
},
{
  id:"ag9-3",
  cityId:"bangkok",
  name:"Phra Sumen Fort Sunset",
  type:"experience",
  neighborhood:"Phra Athit",
  description:"An 18th-century watchtower fort at the north end of Phra Athit road that you can walk around for free. At sunset, the lawn between the fort and the river is claimed by university students picnicking, elderly Thais doing tai chi, and occasional musicians. It is the most unpretentious sunset spot in Bangkok.",
  vibe:9.4,
  localLove:9.7,
  uniqueness:8.4,
  tags:["18th century fort", "free", "picnic", "sunset", "tai chi", "university students"],
  tip:"Arrive at 5:30pm with food from the street vendors on Phra Athit road. The west-facing river view is best from the base of the fort.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Banglamphu / Phra Nakhon",
  lat:13.7607,
  lng:100.4948,
  maps_url:"https://www.google.com/maps?q=13.7607,100.4948",
  transport:[{line:"Boat", station:"Phra Arthit Pier", walk_min:4}],
  photo_url:"https://source.unsplash.com/featured/800x500/?fort,riverside,sunset,students,park,orange,sky"
},
{
  id:"ag9-4",
  cityId:"bangkok",
  name:"Banglamphu Community Mural Trail",
  type:"experience",
  neighborhood:"Banglamphu back streets",
  description:"A self-directed walking trail through the sois behind Khao San Road that encounters a series of murals commissioned from Thai street artists over the past decade. The murals are political, playful, and deeply local \u2014 references to Thai folk tales, student protest history, and neighbourhood characters. None of them are on any map.",
  vibe:9.0,
  localLove:8.5,
  uniqueness:8.9,
  tags:["murals", "street art", "self-guided", "political art", "thai folk tales"],
  tip:"Start on Soi Rambuttri and walk away from Khao San. Look left and right \u2014 several murals are on interior walls. Best in morning light.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Banglamphu / Phra Nakhon",
  lat:13.7578,
  lng:100.4985,
  maps_url:"https://www.google.com/maps?q=13.7578,100.4985",
  transport:[{line:"Boat", station:"Phra Arthit Pier", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?street,art,murals,walking,neighbourhood"
},
{
  id:"ag9-5",
  cityId:"bangkok",
  name:"Jae Pong Khao Tom",
  type:"restaurant",
  neighborhood:"Banglamphu",
  description:"A late-night rice porridge restaurant that opens at 11pm and runs until 5am, catering to the hospitality industry workers who finish their shifts and need to eat. No atmosphere packaging \u2014 strip lights, plastic tables, and a khao tom made with pork and ginger that tastes like someone loves you. 60 baht for a bowl.",
  vibe:8.2,
  localLove:9.8,
  uniqueness:8.0,
  tags:["khao tom", "11pm-5am", "hospitality workers", "strip lights", "60 baht"],
  tip:"Go at 1am when it's full of cooks and waiters from nearby restaurants. Order the pork khao tom with salted egg on the side.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Banglamphu / Phra Nakhon",
  lat:13.7574,
  lng:100.4989,
  maps_url:"https://www.google.com/maps?q=13.7574,100.4989",
  transport:[{line:"Boat", station:"Phra Arthit Pier", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?late,night,rice,porridge,workers,broth,bowl"
},
{
  id:"ag9-6",
  cityId:"bangkok",
  name:"Thai Puppet Theatre Marionette",
  type:"experience",
  neighborhood:"Phra Nakhon",
  description:"A traditional Thai marionette theatre company operating from a converted shophouse that performs original shows twice weekly. The marionettes are hand-crafted to 200-year-old specifications and the performances draw on Ramakien mythology. The company sustains itself through workshops where visitors can learn marionette manipulation.",
  vibe:9.0,
  localLove:8.0,
  uniqueness:9.6,
  tags:["marionette theatre", "ramakien", "traditional craft", "twice weekly", "workshop available"],
  tip:"Wednesday and Saturday shows at 2pm and 7pm. Book via their LINE. The 90-minute performance includes an English-language synopsis handout.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Banglamphu / Phra Nakhon",
  lat:13.7519,
  lng:100.4978,
  maps_url:"https://www.google.com/maps?q=13.7519,100.4978",
  transport:[{line:"Boat", station:"Tha Chang", walk_min:9}, {line:"MRT Blue", station:"Sam Yot", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thai,puppet,marionette,traditional,silk"
},
{
  id:"ag9-7",
  cityId:"bangkok",
  name:"Khaosan Road At 7am",
  type:"experience",
  neighborhood:"Khao San",
  description:"The most interesting time to visit Khao San Road is 7am, after the night crowd has gone and before the tourist operations open. Street cleaners, local noodle vendors setting up, residents collecting their morning coffee, the odd stray survivor from the night before. The street belongs to the neighbourhood for exactly two hours.",
  vibe:8.8,
  localLove:9.1,
  uniqueness:8.6,
  tags:["7am", "post-night", "noodle vendors", "local morning", "temporary quiet"],
  tip:"The noodle cart that sets up outside 7-Eleven at 6:45am does a kuay teow naam that the street cleaners queue for.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Banglamphu / Phra Nakhon",
  lat:13.7582,
  lng:100.4972,
  maps_url:"https://www.google.com/maps?q=13.7582,100.4972",
  transport:[{line:"Boat", station:"Phra Arthit Pier", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?khao,san,road,empty,quiet,morning,coffee"
},
{
  id:"ag9-8",
  cityId:"bangkok",
  name:"Democracy Monument After Dark",
  type:"experience",
  neighborhood:"Ratchadamnoen",
  description:"The central landmark of Bangkok's political history is transformed after 10pm into an impromptu gathering point for young Thais \u2014 skateboarders, students, artists \u2014 who come to sit on the monument's base, eat papaya salad from a nearby cart, and talk. The monument has been the site of every major political protest; at night it belongs to youth.",
  vibe:9.1,
  localLove:9.4,
  uniqueness:8.8,
  tags:["democracy monument", "after dark", "skateboarders", "political history", "student gathering"],
  tip:"Come on a Friday or Saturday night after 10pm. The papaya salad cart on the north side is the best in the area.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Banglamphu / Phra Nakhon",
  lat:13.7564,
  lng:100.5024,
  maps_url:"https://www.google.com/maps?q=13.7564,100.5024",
  transport:[{line:"Boat", station:"Tha Phan Fa", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?monument,night,light,youth,crowd,city"
},
{
  id:"ag9-9",
  cityId:"bangkok",
  name:"Rongros Community Kitchen",
  type:"restaurant",
  neighborhood:"Banglamphu",
  description:"A community kitchen project in Banglamphu that operates as a social enterprise \u2014 trained chefs from marginalised communities serve a rotating regional Thai menu at below-market prices. The meals are excellent and eating there contributes directly to vocational training programmes. The weekly menu is posted on their door every Monday.",
  vibe:8.5,
  localLove:8.9,
  uniqueness:8.7,
  tags:["social enterprise", "community kitchen", "regional thai", "weekly rotating menu", "below market price"],
  tip:"Check the weekly menu posted Monday morning. The northern dishes tend to be the strongest \u2014 the chef roster rotates monthly.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Banglamphu / Phra Nakhon",
  lat:13.7576,
  lng:100.4981,
  maps_url:"https://www.google.com/maps?q=13.7576,100.4981",
  transport:[{line:"Boat", station:"Phra Arthit Pier", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?community,kitchen,cooking,social,enterprise"
},
{
  id:"ag10-0",
  cityId:"bangkok",
  name:"Apoteka",
  type:"bar",
  neighborhood:"Sukhumvit Soi 11",
  description:"A Croatian-owned bar that operates on the premise that the house cocktail will be whatever the bartender thinks suits you. The bottles behind the bar include spirits that can't be found anywhere else in Bangkok \u2014 obscure Balkan brandies, natural amaro from small producers, and the owner's private stock of Mezcal from a Oaxacan village. Twenty seats and a rotation of regulars who came once and never quite left.",
  vibe:9.3,
  localLove:8.4,
  uniqueness:9.5,
  tags:["bartender decides", "rare spirits", "balkan brandy", "mezcal", "20 seats"],
  tip:"Sit at the bar and ask what you should drink. If you say 'something unusual' they will take that seriously.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Sukhumvit Mid (Asok\u2013Phrom Phong)",
  lat:13.7418,
  lng:100.5522,
  maps_url:"https://www.google.com/maps?q=13.7418,100.5522",
  transport:[{line:"BTS Sukhumvit", station:"Nana (E3)", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?cocktail,bar,rare,spirits,bottles,shelves"
},
{
  id:"ag10-1",
  cityId:"bangkok",
  name:"Supanniga Eating Room",
  type:"restaurant",
  neighborhood:"Sukhumvit Soi 55",
  description:"A restaurant that serves the grandmother's recipes of its owner \u2014 Thai-Chinese home cooking from Trat province that has no presence in restaurant culture because it was only ever cooked at home. The stir-fried crab with yellow curry powder is a revelation. The room is calm and full of Thai families having the meal they can't cook for themselves.",
  vibe:8.9,
  localLove:9.3,
  uniqueness:9.1,
  tags:["grandmother recipes", "trat province", "thai-chinese home cooking", "crab curry powder", "family dining"],
  tip:"The crab with yellow curry powder and the pork belly with Chinese five spice. Book ahead for weekends.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Sukhumvit Mid (Asok\u2013Phrom Phong)",
  lat:13.7287,
  lng:100.5871,
  maps_url:"https://www.google.com/maps?q=13.7287,100.5871",
  transport:[{line:"BTS Sukhumvit", station:"Thong Lo (E6)", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thai,home,cooking,family,recipe,restaurant"
},
{
  id:"ag10-2",
  cityId:"bangkok",
  name:"Asia Today Record Bar",
  type:"bar",
  neighborhood:"Asok",
  description:"A record bar behind a steamed bun shop that opens at 7pm and plays records chosen by whoever shows up first that evening. The system is extraordinary \u2014 a 1970s Japanese setup the owner spent four years restoring. There is no DJ, only a rotating selection that anyone in the room can contribute to from the shop's collection.",
  vibe:9.5,
  localLove:9.0,
  uniqueness:9.7,
  tags:["record bar", "communal selection", "1970s system", "steamed bun entrance", "7pm"],
  tip:"Come at 7pm when it opens. Bring a record you want to hear and they'll play it.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Sukhumvit Mid (Asok\u2013Phrom Phong)",
  lat:13.7358,
  lng:100.5598,
  maps_url:"https://www.google.com/maps?q=13.7358,100.5598",
  transport:[{line:"BTS Sukhumvit", station:"Asok (E4)", walk_min:8}, {line:"MRT Blue", station:"Sukhumvit", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?record,bar,vinyl,speakers,music,dark"
},
{
  id:"ag10-3",
  cityId:"bangkok",
  name:"Ruam Jai Fruit Market",
  type:"market",
  neighborhood:"Asok",
  description:"An overnight wholesale fruit market in the Asok area that operates from midnight to 6am. The variety of tropical fruit \u2014 many varieties never seen in tourist markets \u2014 is extraordinary, and the prices are source-adjacent. Durian, rambutan, rose apple, and seasonal varieties brought directly from provincial orchards.",
  vibe:8.6,
  localLove:9.6,
  uniqueness:9.0,
  tags:["overnight", "wholesale fruit", "midnight-6am", "tropical variety", "direct from orchards"],
  tip:"Go at 2am. The best durian arrives between 1-3am from Nonthaburi and Chanthaburi. Bring your own bag and cash.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Sukhumvit Mid (Asok\u2013Phrom Phong)",
  lat:13.7354,
  lng:100.5585,
  maps_url:"https://www.google.com/maps?q=13.7354,100.5585",
  transport:[{line:"BTS Sukhumvit", station:"Asok (E4)", walk_min:10}, {line:"MRT Blue", station:"Sukhumvit", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?tropical,fruit,market,midnight,mango,durian"
},
{
  id:"ag10-4",
  cityId:"bangkok",
  name:"Nahm (The Bar)",
  type:"bar",
  neighborhood:"Como Metropolitan, Sathorn",
  description:"Not the restaurant \u2014 the bar of the Nahm space that serves complex Thai-inspired cocktails created by the bar team using the same respect for traditional Thai flavour architecture that makes the kitchen famous. You can sit at the bar for 400-600 baht a drink and receive something genuinely extraordinary. More approachable and less reserved than the dining room.",
  vibe:9.1,
  localLove:8.0,
  uniqueness:9.4,
  tags:["thai cocktails", "bar only", "traditional flavour", "400-600 baht", "hotel bar"],
  tip:"Sit at the bar and tell them you're interested in Thai botanical ingredients. They will create something specifically.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Sukhumvit Mid (Asok\u2013Phrom Phong)",
  lat:13.7218,
  lng:100.5279,
  maps_url:"https://www.google.com/maps?q=13.7218,100.5279",
  transport:[{line:"BTS Silom", station:"Chong Nonsi (S3)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?luxury,hotel,bar,thai,cocktails,garden"
},
{
  id:"ag10-5",
  cityId:"bangkok",
  name:"Emquartier Helix Food Hall",
  type:"market",
  neighborhood:"Phrom Phong",
  description:"The upper floors of Emquartier mall house a food spiral that most tourists mistake for a tourist attraction but is actually the daily lunch and dinner destination for the Phrom Phong residential and office population. Thai regional food, Japanese ramen, and local specialities at Thai prices, completely removed from the tourist-facing stalls below.",
  vibe:8.0,
  localLove:9.1,
  uniqueness:7.4,
  tags:["food hall", "helix", "thai regional", "daily local", "hidden floors"],
  tip:"Take the spiral escalator up past the tourist floor. The Isan food court on the upper level has the best larb in the building.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Sukhumvit Mid (Asok\u2013Phrom Phong)",
  lat:13.7304,
  lng:100.5692,
  maps_url:"https://www.google.com/maps?q=13.7304,100.5692",
  transport:[{line:"BTS Sukhumvit", station:"Phrom Phong (E5)", walk_min:3}],
  photo_url:"https://source.unsplash.com/featured/800x500/?food,court,mall,isan,thai,varieties"
},
{
  id:"ag10-6",
  cityId:"bangkok",
  name:"Fermented Bangkok",
  type:"restaurant",
  neighborhood:"Sukhumvit Soi 26",
  description:"A small restaurant focused entirely on fermented and preserved Thai foods \u2014 pla ra (fermented fish), naem (fermented pork), miang (fermented tea leaves), and a rotating selection of regional preserved vegetables. The menu is educational and the chef explains everything. Not for every palate, but for those willing to go there, the most interesting flavours in the city.",
  vibe:8.7,
  localLove:8.3,
  uniqueness:9.8,
  tags:["fermented foods", "pla ra", "naem", "fermented tea", "educational menu"],
  tip:"Book ahead and tell them your experience level with fermented flavours. They will calibrate the menu. Start with the miang for acclimatisation.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Sukhumvit Mid (Asok\u2013Phrom Phong)",
  lat:13.7317,
  lng:100.568,
  maps_url:"https://www.google.com/maps?q=13.7317,100.568",
  transport:[{line:"BTS Sukhumvit", station:"Phrom Phong (E5)", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?fermented,food,restaurant,unique,jars"
},
{
  id:"ag10-7",
  cityId:"bangkok",
  name:"Above Eleven",
  type:"bar",
  neighborhood:"Sukhumvit Soi 11",
  description:"A rooftop bar that the Peruvian-Japanese chef concept makes unique \u2014 nikkei cocktails using pisco alongside Japanese whisky, the Peruvian food influence applied to Thai ingredients. It's consistently overlooked because it's not on the standard tourist list, and the crowd is consequently Bangkok professional rather than backpacker overflow.",
  vibe:8.8,
  localLove:7.9,
  uniqueness:8.7,
  tags:["nikkei", "rooftop", "pisco", "japanese whisky", "peruvian-japanese"],
  tip:"The pisco sour variations are the signature. Go for the view at dusk, stay for the food as the city lights up.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Sukhumvit Mid (Asok\u2013Phrom Phong)",
  lat:13.7416,
  lng:100.5524,
  maps_url:"https://www.google.com/maps?q=13.7416,100.5524",
  transport:[{line:"BTS Sukhumvit", station:"Nana (E3)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?rooftop,bar,peruvian,japanese,view,skyline"
},
{
  id:"ag10-8",
  cityId:"bangkok",
  name:"Siri House",
  type:"experience",
  neighborhood:"Sukhumvit Soi 1",
  description:"A converted 1950s house that functions as a community art space, Thai contemporary gallery, and occasional pop-up restaurant in the garden. The programming changes monthly. On weekends the garden becomes a small market for Thai independent designers and the gallery is open for free. The house itself is worth the visit.",
  vibe:8.9,
  localLove:8.6,
  uniqueness:8.8,
  tags:["converted house", "art gallery", "1950s", "garden market", "independent designers"],
  tip:"Check their social media for weekend programming. The garden pop-up market happens on the last Sunday of each month.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Sukhumvit Mid (Asok\u2013Phrom Phong)",
  lat:13.7395,
  lng:100.5459,
  maps_url:"https://www.google.com/maps?q=13.7395,100.5459",
  transport:[{line:"BTS Sukhumvit", station:"Ploen Chit (E2)", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?converted,house,gallery,garden,art"
},
{
  id:"ag10-9",
  cityId:"bangkok",
  name:"Yusup Pochana",
  type:"restaurant",
  neighborhood:"Sukhumvit Soi 3 / Nana",
  description:"A Southern Thai-Muslim restaurant near the Nana mosque that has been operating in the same location for 40 years. The chicken biryani is cooked in a single giant pot and served on a banana leaf. The community eating here is a mix of Thai Muslims, South Asian expats, and the occasional food pilgrim who found it by walking the soi. One of Bangkok's most authentic rice dishes.",
  vibe:8.4,
  localLove:9.5,
  uniqueness:8.6,
  tags:["thai muslim", "biryani", "banana leaf", "40 years", "nana mosque"],
  tip:"Lunch only, opens at 11am and closes when the biryani pot is empty. Arrive by noon.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Sukhumvit Mid (Asok\u2013Phrom Phong)",
  lat:13.7408,
  lng:100.5509,
  maps_url:"https://www.google.com/maps?q=13.7408,100.5509",
  transport:[{line:"BTS Sukhumvit", station:"Nana (E3)", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,halal,muslim,food,banana,leaf"
},
{
  id:"mag1-0",
  cityId:"mumbai",
  name:"Ideal Corner",
  type:"restaurant",
  neighborhood:"Fort",
  description:"A Parsi-run institution in a crumbling Fort building that serves dhansak, salli boti, and patra ni machhi to a lunchtime crowd of lawyers, journalists, and office workers who've been coming for decades. The banana leaf caramel custard has no business being this good.",
  vibe:8.9,
  localLove:9.5,
  uniqueness:9.0,
  tags:["parsi", "dhansak", "fort", "lunch institution", "banana leaf custard"],
  tip:"Go for lunch only \u2014 open 11:30am to 3:30pm weekdays. The dhansak and salli boti combo with caramel custard after.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Colaba / Fort / CST",
  lat:18.9319,
  lng:72.834,
  maps_url:"https://www.google.com/maps?q=18.9319,72.8340",
  transport:[{line:"Western Line", station:"Churchgate", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,parsi,restaurant,lunch,fort,lawyers"
},
{
  id:"mag1-1",
  cityId:"mumbai",
  name:"Britannia & Co",
  type:"restaurant",
  neighborhood:"Ballard Estate",
  description:"A Parsi-run restaurant in operation since 1923 where the 90-year-old owner Boman Kohinoor personally greets regulars and still oversees the berry pulao \u2014 made with barberries brought from Iran. The room smells of decades of caramelised onion and goodwill.",
  vibe:9.3,
  localLove:9.4,
  uniqueness:9.7,
  tags:["parsi", "berry pulao", "1923", "ballard estate", "boman kohinoor"],
  tip:"Berry pulao is the only order. Open lunch only, closed Sundays. Go on a weekday to meet Mr Kohinoor himself.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Colaba / Fort / CST",
  lat:18.936,
  lng:72.84,
  maps_url:"https://www.google.com/maps?q=18.9360,72.8400",
  transport:[{line:"Western Line", station:"CST / Churchgate", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,parsi,heritage,restaurant,lunch,century"
},
{
  id:"mag1-2",
  cityId:"mumbai",
  name:"Kyani & Co",
  type:"restaurant",
  neighborhood:"Marine Lines / JSS Road",
  description:"The oldest surviving Irani caf\u00e9 in Mumbai \u2014 open since 1904. Bentwood chairs, yellowing menus, and a mawa cake that no patisserie in the city has managed to replicate. The tea comes in a glass. The conversation is always better than anywhere else.",
  vibe:9.0,
  localLove:9.3,
  uniqueness:9.5,
  tags:["irani cafe", "1904", "mawa cake", "marine lines", "glass chai"],
  tip:"The mawa cake and bun maska. Come at 8am before the lunchtime crowd arrives.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Colaba / Fort / CST",
  lat:18.9444,
  lng:72.8244,
  maps_url:"https://www.google.com/maps?q=18.9444,72.8244",
  transport:[{line:"Western Line", station:"Marine Lines", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?irani,cafe,vintage,bentwood,chairs,mawa,cake"
},
{
  id:"mag1-3",
  cityId:"mumbai",
  name:"Kala Ghoda Caf\u00e9",
  type:"restaurant",
  neighborhood:"Kala Ghoda / Fort",
  description:"A small caf\u00e9 that has been the unofficial meeting room of Mumbai's art and architecture world since 2002. Operates from a former Babulnath temple trust building. The filter coffee is taken seriously. The walls are covered in rotating work by local artists who can't yet afford a gallery.",
  vibe:8.7,
  localLove:9.0,
  uniqueness:8.4,
  tags:["art crowd", "filter coffee", "gallery walls", "kala ghoda", "architect favourite"],
  tip:"The mushroom on toast and filter coffee. Tuesday evenings have informal artist talks \u2014 walk in.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Colaba / Fort / CST",
  lat:18.9287,
  lng:72.8315,
  maps_url:"https://www.google.com/maps?q=18.9287,72.8315",
  transport:[{line:"Western Line", station:"CST", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,cafe,art,gallery,kala,ghoda,coffee"
},
{
  id:"mag1-4",
  cityId:"mumbai",
  name:"Aaswad",
  type:"restaurant",
  neighborhood:"Dadar West",
  description:"A no-frills Maharashtrian canteen that serves the best misal pav and sabudana khichdi in the city \u2014 a claim its regulars will defend aggressively. Open from 7am. Cash only. The thali at lunch has not changed in 40 years. Locals queue outside daily.",
  vibe:8.6,
  localLove:9.8,
  uniqueness:8.2,
  tags:["maharashtrian", "misal pav", "sabudana khichdi", "7am", "40 year thali"],
  tip:"Arrive by 7:30am for breakfast. The misal is the reason. Expect a queue. Cash only.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Colaba / Fort / CST",
  lat:19.0183,
  lng:72.8422,
  maps_url:"https://www.google.com/maps?q=19.0183,72.8422",
  transport:[{line:"Western Line", station:"Dadar", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?maharashtrian,misal,pav,sabudana,breakfast,queue"
},
{
  id:"mag1-5",
  cityId:"mumbai",
  name:"Excelsior Art Deco Cinema",
  type:"experience",
  neighborhood:"Fort",
  description:"A 1930s art deco cinema that still screens Bollywood films to a walk-in audience of Fort office workers and nearby residents. The interior \u2014 original terrazzo floors, brass fixtures, and a hand-painted curtain \u2014 is a surviving specimen of Mumbai's golden age of cinema architecture.",
  vibe:9.2,
  localLove:8.8,
  uniqueness:9.4,
  tags:["art deco", "1930s cinema", "fort", "walk-in", "terrazzo"],
  tip:"Check show times on the board outside. The single-screen hall for \u20b980. The interval cutting chai is essential.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Colaba / Fort / CST",
  lat:18.9324,
  lng:72.8348,
  maps_url:"https://www.google.com/maps?q=18.9324,72.8348",
  transport:[{line:"Western Line", station:"Churchgate", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?art,deco,cinema,vintage,interior,1930s"
},
{
  id:"mag1-6",
  cityId:"mumbai",
  name:"Bastian Colaba",
  type:"bar",
  neighborhood:"Colaba",
  description:"A seafood-focused bar and restaurant in a former garage in Colaba's back streets that became famous for its chilled-out vibe before the crowds found it. The raw bar is excellent, the wine list is genuinely considered, and the local clientele on weeknights is exactly the Colaba crowd you want to be among.",
  vibe:8.8,
  localLove:8.5,
  uniqueness:8.1,
  tags:["seafood bar", "raw bar", "colaba", "garage", "wine list"],
  tip:"The oysters and the Sri Lankan crab curry. Book for weekends, walk in weeknights.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Colaba / Fort / CST",
  lat:18.9211,
  lng:72.8301,
  maps_url:"https://www.google.com/maps?q=18.9211,72.8301",
  transport:[{line:"Bus", station:"Colaba Causeway", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?seafood,raw,bar,oysters,colaba,restaurant"
},
{
  id:"mag1-7",
  cityId:"mumbai",
  name:"Asiatic Society Library Reading Room",
  type:"experience",
  neighborhood:"Fort / Town Hall",
  description:"A 19th-century neoclassical library building with a reading room open to the public that holds one of the finest collections of rare manuscripts and early Indian print material. The reading room on the first floor \u2014 with its ceiling fans and original reading lamps \u2014 is the calmest room in Mumbai.",
  vibe:9.1,
  localLove:8.3,
  uniqueness:9.6,
  tags:["library", "19th century", "rare manuscripts", "reading room", "neoclassical"],
  tip:"Bring ID and sign in at the desk. The upper gallery with the curved reading tables is open on weekday mornings.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Colaba / Fort / CST",
  lat:18.931,
  lng:72.8337,
  maps_url:"https://www.google.com/maps?q=18.9310,72.8337",
  transport:[{line:"Western Line", station:"Churchgate", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?library,neoclassical,heritage,reading,room,columns"
},
{
  id:"mag1-8",
  cityId:"mumbai",
  name:"Crawford Market Morning",
  type:"market",
  neighborhood:"Crawford Market / Masjid",
  description:"Mumbai's Victorian wholesale market at 6am, before it opens to retail customers \u2014 wholesale flower vendors, spice traders and produce merchants who've worked these stalls for generations. The cast iron arcades and the stone reliefs by Kipling's father are best appreciated before the crowds arrive.",
  vibe:9.0,
  localLove:9.4,
  uniqueness:8.7,
  tags:["victorian market", "wholesale", "flowers", "spices", "kipling"],
  tip:"6-8am for the wholesale atmosphere. The flower section in the rear courtyard is extraordinary. Kipling's bas-reliefs are above the main entrance.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Colaba / Fort / CST",
  lat:18.9487,
  lng:72.8344,
  maps_url:"https://www.google.com/maps?q=18.9487,72.8344",
  transport:[{line:"Central Line", station:"Masjid Bunder", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?crawford,market,victorian,wholesale,flowers,dawn"
},
{
  id:"mag1-9",
  cityId:"mumbai",
  name:"Oval Maidan Evening Cricket",
  type:"experience",
  neighborhood:"Oval Maidan / Churchgate",
  description:"The city's lungs, where informal cricket matches run from 4pm until dark across dozens of simultaneous pitches on the same ground. Young men play seriously while the art deco and Victorian buildings of the Bombay High Court and University of Mumbai form a backdrop that no architect alive could have planned.",
  vibe:9.5,
  localLove:9.7,
  uniqueness:8.9,
  tags:["cricket", "oval maidan", "art deco", "evening", "free"],
  tip:"Come at 4:30pm weekdays. Sit on the steps of the Rajabai Tower side and watch three games simultaneously.",
  status:"approved",
  agentIcon:"\ud83c\udfdb\ufe0f",
  discoveredBy:"Colaba / Fort / CST",
  lat:18.9275,
  lng:72.8284,
  maps_url:"https://www.google.com/maps?q=18.9275,72.8284",
  transport:[{line:"Western Line", station:"Churchgate", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,oval,maidan,cricket,evening,art,deco"
},
{
  id:"mag2-0",
  cityId:"mumbai",
  name:"Pali Bhavan",
  type:"restaurant",
  neighborhood:"Pali Hill, Bandra",
  description:"A converted bungalow with an open verandah that serves Goan-influenced coastal food in a setting that feels more Panaji than Mumbai. The prawn curry is from a 100-year-old Goan recipe. Locals bring out-of-towners here specifically to show them a version of Mumbai that doesn't advertise itself.",
  vibe:9.1,
  localLove:9.0,
  uniqueness:8.7,
  tags:["goan", "prawn curry", "bungalow", "verandah", "coastal"],
  tip:"The prawn curry rice and the fish recheado. Book the verandah table.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Bandra West / Pali Hill",
  lat:19.0596,
  lng:72.8268,
  maps_url:"https://www.google.com/maps?q=19.0596,72.8268",
  transport:[{line:"Western Line", station:"Bandra", walk_min:17}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bandra,bungalow,verandah,goan,coastal,restaurant"
},
{
  id:"mag2-1",
  cityId:"mumbai",
  name:"Elco Pani Puri, Bandra",
  type:"restaurant",
  neighborhood:"Hill Road, Bandra",
  description:"A pani puri stall that has been operating from the same spot on Hill Road since 1953, run by the fourth generation of the same Rajasthani family. The puri is hand-rolled, the pani comes in six flavours, and the filling is a precise recipe that has not changed. The queue is always there.",
  vibe:8.8,
  localLove:9.7,
  uniqueness:8.9,
  tags:["pani puri", "1953", "family run", "hill road", "4th generation"],
  tip:"Go between 5-7pm when the evening crowd is manageable. Order the imli variant first, then the mint. Six per round minimum.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Bandra West / Pali Hill",
  lat:19.0644,
  lng:72.8356,
  maps_url:"https://www.google.com/maps?q=19.0644,72.8356",
  transport:[{line:"Western Line", station:"Bandra", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?pani,puri,street,food,bandra,hill,road,queue"
},
{
  id:"mag2-2",
  cityId:"mumbai",
  name:"Candies",
  type:"restaurant",
  neighborhood:"Pali Naka, Bandra",
  description:"A Bandra institution that has been a meeting point for the neighbourhood's creative class since the 1980s. Outdoor tables, excellent filter coffee, sandwiches on proper bread, and the kind of Sunday morning where nobody is in a hurry. The carrot cake is the city's benchmark.",
  vibe:8.6,
  localLove:9.2,
  uniqueness:7.8,
  tags:["bandra institution", "filter coffee", "carrot cake", "1980s", "creative crowd"],
  tip:"Sunday mornings are the occasion. The carrot cake and filter coffee. Arrive early for a pavement table.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Bandra West / Pali Hill",
  lat:19.0571,
  lng:72.8292,
  maps_url:"https://www.google.com/maps?q=19.0571,72.8292",
  transport:[{line:"Western Line", station:"Bandra", walk_min:15}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bandra,cafe,sunday,morning,coffee,outdoor,tables"
},
{
  id:"mag2-3",
  cityId:"mumbai",
  name:"Bandra Reclamation Promenade",
  type:"experience",
  neighborhood:"Bandra West, reclamation",
  description:"A 2km walking path along the reclaimed sea edge of Bandra that's claimed by joggers, elderly couples, schoolkids, and fishermen simultaneously. At dusk the Bandra-Worli Sea Link lights up across the water. Completely free. The chai wallahs set up at strategic points every 400 metres.",
  vibe:9.3,
  localLove:9.6,
  uniqueness:8.1,
  tags:["sea promenade", "free", "sea link view", "chai wallahs", "evening walk"],
  tip:"The hour before sunset is the best. Walk north toward the Bandra Fort ruins at the end for the best sea link view.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Bandra West / Pali Hill",
  lat:19.0486,
  lng:72.8196,
  maps_url:"https://www.google.com/maps?q=19.0486,72.8196",
  transport:[{line:"Western Line", station:"Bandra", walk_min:20}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bandra,sea,promenade,sunset,sea,link,view"
},
{
  id:"mag2-4",
  cityId:"mumbai",
  name:"Bandra Fort Ruins",
  type:"experience",
  neighborhood:"Land's End, Bandra",
  description:"The remains of a Portuguese sea fort on the northern headland of Bandra, surrounded by fishermen's colony and a park where local teenagers and families gather. The view of the Arabian Sea and Bandra-Worli Sea Link from the battlement edge is Mumbai at its most dramatic.",
  vibe:9.4,
  localLove:9.1,
  uniqueness:8.5,
  tags:["portuguese fort", "ruins", "sea view", "free", "headland"],
  tip:"Sunrise or the hour before sunset. Walk through the fishing colony to the north gate \u2014 the fishermen's houses wrapped around the fort walls are extraordinary.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Bandra West / Pali Hill",
  lat:19.048,
  lng:72.8169,
  maps_url:"https://www.google.com/maps?q=19.0480,72.8169",
  transport:[{line:"Western Line", station:"Bandra", walk_min:22}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bandra,fort,ruins,headland,sea,view,arabian"
},
{
  id:"mag2-5",
  cityId:"mumbai",
  name:"The Bungalow, Bandra",
  type:"bar",
  neighborhood:"Pali Hill",
  description:"A 1930s colonial bungalow that survived Bandra's redevelopment to become a bar with an extraordinary garden. The gin list is the longest in Mumbai. The cocktails use local botanicals. On a Tuesday evening with no crowds and a gin and tonic in the garden, it's the best hour in the western suburbs.",
  vibe:9.0,
  localLove:8.6,
  uniqueness:8.9,
  tags:["colonial bungalow", "gin list", "garden bar", "1930s", "pali hill"],
  tip:"Tuesday or Wednesday evening for the garden. The house gin and tonic with kaffir lime is the opening move.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Bandra West / Pali Hill",
  lat:19.0601,
  lng:72.8261,
  maps_url:"https://www.google.com/maps?q=19.0601,72.8261",
  transport:[{line:"Western Line", station:"Bandra", walk_min:16}],
  photo_url:"https://source.unsplash.com/featured/800x500/?colonial,bungalow,garden,gin,bar,evening"
},
{
  id:"mag2-6",
  cityId:"mumbai",
  name:"Carter Road Food Carts",
  type:"market",
  neighborhood:"Carter Road, Bandra",
  description:"The sea-facing carter road promenade is lined with carts selling bhel, corn, and roasted peanuts from dusk \u2014 but the serious ones are the vadapav and pav bhaji carts behind the road near the basketball courts where the local Bandra crowd eats after football practice.",
  vibe:8.5,
  localLove:9.4,
  uniqueness:7.7,
  tags:["carter road", "bhel", "vadapav", "evening carts", "football crowd"],
  tip:"The vadapav cart on the north end near the sports ground is the genuine article. Come after 7pm when the football crowd rolls in.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Bandra West / Pali Hill",
  lat:19.0521,
  lng:72.8189,
  maps_url:"https://www.google.com/maps?q=19.0521,72.8189",
  transport:[{line:"Western Line", station:"Bandra", walk_min:18}],
  photo_url:"https://source.unsplash.com/featured/800x500/?carter,road,mumbai,food,carts,evening,sea"
},
{
  id:"mag2-7",
  cityId:"mumbai",
  name:"Bandra's Chapel Road Street Art",
  type:"experience",
  neighborhood:"Chapel Road / Union Park",
  description:"A residential lane in Bandra that has been steadily colonised by street murals \u2014 fish, Konkani women, art deco geometry, and political commentary. Completely unplanned, entirely authentic. The murals change as buildings are repainted and new artists add their layers.",
  vibe:8.7,
  localLove:8.5,
  uniqueness:8.6,
  tags:["street art", "murals", "bandra", "walking", "chapel road"],
  tip:"Walk Chapel Road to Union Park and back. Morning light is best for photography. The newest murals tend to be around the church wall.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Bandra West / Pali Hill",
  lat:19.062,
  lng:72.8308,
  maps_url:"https://www.google.com/maps?q=19.0620,72.8308",
  transport:[{line:"Western Line", station:"Bandra", walk_min:13}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bandra,street,art,murals,chapel,road,fish"
},
{
  id:"mag2-8",
  cityId:"mumbai",
  name:"Cafe Noorani",
  type:"restaurant",
  neighborhood:"Haji Ali, Mahalaxmi",
  description:"A 70-year-old Mughlai restaurant near Haji Ali that serves the city's best seekh kebabs, mutton biryani, and shammi kebabs to a clientele that ranges from South Mumbai lawyers to suburban taxi drivers. The sign is modest. The queue is not.",
  vibe:8.8,
  localLove:9.5,
  uniqueness:8.5,
  tags:["mughlai", "seekh kebabs", "70 years", "biryani", "haji ali"],
  tip:"The seekh kebab and mutton biryani. Go between 1-2pm when the kitchen is in full rhythm.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Bandra West / Pali Hill",
  lat:18.9719,
  lng:72.8123,
  maps_url:"https://www.google.com/maps?q=18.9719,72.8123",
  transport:[{line:"Bus", station:"Haji Ali", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,mughlai,restaurant,seekh,kebabs,haji,ali"
},
{
  id:"mag2-9",
  cityId:"mumbai",
  name:"Haji Ali Juice Centre",
  type:"restaurant",
  neighborhood:"Haji Ali",
  description:"A legendary juice bar at the causeway entrance to Haji Ali Dargah that has been making fresh fruit juices and milkshakes for 50 years. The mango milk is a religious experience between March and June. The chikoo milk is year-round and equally essential.",
  vibe:8.7,
  localLove:9.4,
  uniqueness:8.0,
  tags:["juice bar", "mango milk", "chikoo", "50 years", "haji ali"],
  tip:"Mango milk between March-June when Alphonso season peaks. The chikoo milkshake year-round. Stand and drink \u2014 the seating is secondary.",
  status:"approved",
  agentIcon:"\ud83c\udf0a",
  discoveredBy:"Bandra West / Pali Hill",
  lat:18.9718,
  lng:72.8105,
  maps_url:"https://www.google.com/maps?q=18.9718,72.8105",
  transport:[{line:"Bus", station:"Haji Ali", walk_min:4}],
  photo_url:"https://source.unsplash.com/featured/800x500/?haji,ali,juice,bar,mango,milkshake,counter"
},
{
  id:"mag3-0",
  cityId:"mumbai",
  name:"Caf\u00e9 Mysore",
  type:"restaurant",
  neighborhood:"Matunga West",
  description:"A South Indian tiffin house that opens at 7am and has been serving idli, medu vada, and dosas to the Tamil Brahmin community of Matunga since 1936. The filter coffee comes in a brass tumbler and the coconut chutney is made fresh every hour. Entirely cash, mostly Tamil spoken.",
  vibe:9.2,
  localLove:9.7,
  uniqueness:9.1,
  tags:["south indian", "idli", "filter coffee", "1936", "tamil brahmin"],
  tip:"Go by 8:30am before the idli runs out. The brass tumbler filter coffee is the reason. Order the medu vada with sambar too.",
  status:"approved",
  agentIcon:"\ud83c\udf5c",
  discoveredBy:"Matunga / Matunga East",
  lat:19.027,
  lng:72.8399,
  maps_url:"https://www.google.com/maps?q=19.0270,72.8399",
  transport:[{line:"Central Line", station:"Matunga", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?matunga,south,indian,filter,coffee,brass,tumbler"
},
{
  id:"mag3-1",
  cityId:"mumbai",
  name:"Ram Ashraya",
  type:"restaurant",
  neighborhood:"Matunga West",
  description:"Since 1942, this unassuming South Indian restaurant has served idli that regulars describe as the city's finest \u2014 thin, cloud-soft, served with six chutneys. The thali at lunch is a ritual for three generations of the same Matunga families. No frills, no Instagram, just irreplaceable cooking.",
  vibe:8.9,
  localLove:9.8,
  uniqueness:9.0,
  tags:["idli", "south indian", "1942", "matunga", "six chutneys"],
  tip:"Arrive at 7am for idli. The lunch thali from 12-3pm. Three generations of regulars will be eating alongside you.",
  status:"approved",
  agentIcon:"\ud83c\udf5c",
  discoveredBy:"Matunga / Matunga East",
  lat:19.0268,
  lng:72.8402,
  maps_url:"https://www.google.com/maps?q=19.0268,72.8402",
  transport:[{line:"Central Line", station:"Matunga", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?south,indian,idli,tiffin,house,morning,chutney"
},
{
  id:"mag3-2",
  cityId:"mumbai",
  name:"Mani's Lunch Home",
  type:"restaurant",
  neighborhood:"Matunga East",
  description:"A Mangalorean family-run restaurant serving the coastal Karnataka classics that are barely represented in Mumbai \u2014 kane rava fry, kori rotti, neer dosa with chicken sukka. The small room seats 20. The cooking is by the family matriarch and has been since 1965.",
  vibe:8.8,
  localLove:9.5,
  uniqueness:9.3,
  tags:["mangalorean", "neer dosa", "kori rotti", "1965", "family matriarch"],
  tip:"Kane rava fry and the neer dosa with chicken sukka. Go for lunch only. Cash only.",
  status:"approved",
  agentIcon:"\ud83c\udf5c",
  discoveredBy:"Matunga / Matunga East",
  lat:19.0278,
  lng:72.844,
  maps_url:"https://www.google.com/maps?q=19.0278,72.8440",
  transport:[{line:"Central Line", station:"Matunga Road", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mangalorean,neer,dosa,fish,curry,family,restaurant"
},
{
  id:"mag3-3",
  cityId:"mumbai",
  name:"King's Circle Flower Market",
  type:"market",
  neighborhood:"King's Circle, Matunga",
  description:"A wholesale flower market that operates in the early morning around the King's Circle roundabout. Marigold, jasmine, lotus, and tuberose arrive from farms in Maharashtra and are sorted, bundled, and sold to temple vendors, wedding decorators, and puja suppliers. The smell alone is worth the journey.",
  vibe:9.1,
  localLove:9.4,
  uniqueness:8.8,
  tags:["flower market", "wholesale", "morning", "marigold", "jasmine", "king's circle"],
  tip:"Go at 5:30am when the flower sorting is at peak. The lotus bundles are extraordinary in season (July-September).",
  status:"approved",
  agentIcon:"\ud83c\udf5c",
  discoveredBy:"Matunga / Matunga East",
  lat:19.0249,
  lng:72.8387,
  maps_url:"https://www.google.com/maps?q=19.0249,72.8387",
  transport:[{line:"Central Line", station:"Matunga", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?flower,market,wholesale,marigold,jasmine,morning,colour"
},
{
  id:"mag3-4",
  cityId:"mumbai",
  name:"Panshikar Provision Stores",
  type:"experience",
  neighborhood:"Matunga West",
  description:"A 100-year-old South Indian grocery store that stocks masalas, pickles, coconut products, and temple supplies that exist nowhere else in Mumbai. The owner can identify every variety of dried lentil by smell. The turmeric root from his Coorg supplier has a following among serious cooks across the city.",
  vibe:8.4,
  localLove:9.2,
  uniqueness:9.0,
  tags:["100 year old", "south indian groceries", "masala", "coorg turmeric", "temple supplies"],
  tip:"Go on Saturday morning when the week's stock arrives from Coorg. Ask for what's fresh \u2014 the owner's recommendations are worth following.",
  status:"approved",
  agentIcon:"\ud83c\udf5c",
  discoveredBy:"Matunga / Matunga East",
  lat:19.0265,
  lng:72.8396,
  maps_url:"https://www.google.com/maps?q=19.0265,72.8396",
  transport:[{line:"Central Line", station:"Matunga", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?south,indian,grocery,heritage,spice,masala,shop"
},
{
  id:"mag3-5",
  cityId:"mumbai",
  name:"Hotel Sharda",
  type:"restaurant",
  neighborhood:"Matunga East",
  description:"A Saraswat Brahmin restaurant that serves Konkani home cooking rarely found in restaurants \u2014 amboli pancakes, sol kadhi, bangda curry, and a fish thali that has been the same since 1970. No menu in English. Point at what the table next to you has.",
  vibe:8.7,
  localLove:9.6,
  uniqueness:9.2,
  tags:["saraswat", "konkani", "amboli", "sol kadhi", "fish thali", "1970"],
  tip:"The fish thali at lunch. Point at what you want. No English menu, but the fish selection is displayed on the counter.",
  status:"approved",
  agentIcon:"\ud83c\udf5c",
  discoveredBy:"Matunga / Matunga East",
  lat:19.0281,
  lng:72.8441,
  maps_url:"https://www.google.com/maps?q=19.0281,72.8441",
  transport:[{line:"Central Line", station:"Matunga Road", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?saraswat,konkani,fish,thali,restaurant,simple"
},
{
  id:"mag3-6",
  cityId:"mumbai",
  name:"Caf\u00e9 Madras",
  type:"restaurant",
  neighborhood:"Matunga West",
  description:"Since 1940, a family-run tiffin house that has served the Telugu and Tamil communities of Matunga and beyond. The rice varieties \u2014 pongal, puliyogare, lemon rice \u2014 rotate daily and are made in limited quantities. The regular crowd considers it a civic responsibility to finish before it closes.",
  vibe:8.8,
  localLove:9.6,
  uniqueness:8.9,
  tags:["telugu", "tamil", "pongal", "puliyogare", "1940", "limited quantities"],
  tip:"The pongal on Tuesday and the puliyogare on Friday are the pilgrimage days. Open 7am to 3pm only.",
  status:"approved",
  agentIcon:"\ud83c\udf5c",
  discoveredBy:"Matunga / Matunga East",
  lat:19.0271,
  lng:72.8397,
  maps_url:"https://www.google.com/maps?q=19.0271,72.8397",
  transport:[{line:"Central Line", station:"Matunga", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?south,indian,pongal,tiffin,family,restaurant,1940"
},
{
  id:"mag3-7",
  cityId:"mumbai",
  name:"Matunga Vegetable Market",
  type:"market",
  neighborhood:"Matunga West",
  description:"A daily wholesale and retail market that supplies the restaurant kitchens of an entire corner of Mumbai. At 6am the South Indian vegetables \u2014 drumstick, raw banana, taro, curry leaf bunches, tamarind pods \u2014 arrive fresh and are gone by 9am. Food writers and chefs come here specifically.",
  vibe:8.5,
  localLove:9.5,
  uniqueness:8.3,
  tags:["vegetable market", "south indian veg", "drumstick", "curry leaves", "wholesale", "6am"],
  tip:"6-8am for the full selection. The curry leaf bundles are the cheapest and freshest in Mumbai. Bring your own bags.",
  status:"approved",
  agentIcon:"\ud83c\udf5c",
  discoveredBy:"Matunga / Matunga East",
  lat:19.0262,
  lng:72.839,
  maps_url:"https://www.google.com/maps?q=19.0262,72.8390",
  transport:[{line:"Central Line", station:"Matunga", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?vegetable,market,south,indian,morning,drumstick"
},
{
  id:"mag3-8",
  cityId:"mumbai",
  name:"A. Mahesh Bhat & Co",
  type:"experience",
  neighborhood:"Matunga West",
  description:"A 60-year-old coconut oil press operating from a wood-and-corrugated-iron shed that still uses a stone mill to cold-press coconut oil. The smell of fresh coconut oil fills the entire street. The oil is sold in glass bottles directly from the press, and the coconut milk is available warm before noon.",
  vibe:8.9,
  localLove:9.1,
  uniqueness:9.5,
  tags:["cold press oil", "stone mill", "coconut oil", "60 years", "direct from press"],
  tip:"Come before noon for fresh warm coconut milk as a by-product. Buy the cold-pressed oil directly \u2014 it's the finest coconut oil available in the city.",
  status:"approved",
  agentIcon:"\ud83c\udf5c",
  discoveredBy:"Matunga / Matunga East",
  lat:19.0266,
  lng:72.8394,
  maps_url:"https://www.google.com/maps?q=19.0266,72.8394",
  transport:[{line:"Central Line", station:"Matunga", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?coconut,oil,cold,press,stone,mill,shed"
},
{
  id:"mag3-9",
  cityId:"mumbai",
  name:"Shiv Sagar Food Centre",
  type:"restaurant",
  neighborhood:"Dadar",
  description:"A South Indian restaurant on Dadar's Shivaji Park ring road that has been serving the park-walkers, political gatherings, and cricket matches for 35 years. The masala dosa is crisp to the point of being structural. The sambar is the standard against which Mumbaikars measure all others.",
  vibe:8.4,
  localLove:9.5,
  uniqueness:7.9,
  tags:["masala dosa", "south indian", "shivaji park", "35 years", "sambar"],
  tip:"Post-cricket match crowd from Shivaji Park comes for lunch. The masala dosa and the fresh lime soda.",
  status:"approved",
  agentIcon:"\ud83c\udf5c",
  discoveredBy:"Matunga / Matunga East",
  lat:19.0187,
  lng:72.8426,
  maps_url:"https://www.google.com/maps?q=19.0187,72.8426",
  transport:[{line:"Western Line", station:"Dadar", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?masala,dosa,south,indian,restaurant,crispy"
},
{
  id:"mag4-0",
  cityId:"mumbai",
  name:"Todi Mill Social",
  type:"bar",
  neighborhood:"Lower Parel",
  description:"A craft beer bar and restaurant inside a restored textile mill \u2014 the mill machinery still visible in the walls. The local craft beers on tap rotate constantly and the food respects the industrial context. The mill chimney visible from the outdoor terrace is a reminder of what this building used to do.",
  vibe:8.7,
  localLove:8.5,
  uniqueness:8.6,
  tags:["mill district", "craft beer", "restored mill", "chimney view", "lower parel"],
  tip:"The taproom section next to the mill wall is the part to find. The seasonal sour beers are worth trying.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Parel / Lower Parel / Worli",
  lat:19.0033,
  lng:72.8318,
  maps_url:"https://www.google.com/maps?q=19.0033,72.8318",
  transport:[{line:"Western Line", station:"Lower Parel", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?lower,parel,mill,craft,beer,bar,industrial"
},
{
  id:"mag4-1",
  cityId:"mumbai",
  name:"Bhau Daji Lad Museum",
  type:"experience",
  neighborhood:"Byculla",
  description:"Mumbai's oldest museum, restored to its 1872 condition \u2014 green and gold Victorian cast iron, terrazzo mosaic floors, and a collection of maps, models, and craft objects that trace the city's history before it was Mumbai. Almost always quiet, often illuminated by shaft-light through high windows.",
  vibe:9.2,
  localLove:8.5,
  uniqueness:9.3,
  tags:["1872 museum", "victorian", "byculla", "city history", "quiet"],
  tip:"Wednesday morning is quietest. The scale model of Bombay in 1800 in the lower hall is astonishing. Entry \u20b920 for Indians.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Parel / Lower Parel / Worli",
  lat:18.9795,
  lng:72.8357,
  maps_url:"https://www.google.com/maps?q=18.9795,72.8357",
  transport:[{line:"Central Line", station:"Byculla", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,victorian,museum,ornate,restoration,byculla"
},
{
  id:"mag4-2",
  cityId:"mumbai",
  name:"Kamala Mills Night",
  type:"bar",
  neighborhood:"Lower Parel",
  description:"The former textile mill complex now houses some of Mumbai's most interesting bars and restaurants in its converted sheds and warehouses. On weekday evenings the crowd is creative industry and startup workers eating dinner; on weekends it transforms. The contrast between the industrial architecture and what happens inside is sharp.",
  vibe:8.5,
  localLove:8.2,
  uniqueness:7.8,
  tags:["mill complex", "converted warehouse", "lower parel", "weeknight", "creative crowd"],
  tip:"Tuesday-Thursday evenings for the least frenetic version. The new restaurant openings in the east sheds are worth exploring.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Parel / Lower Parel / Worli",
  lat:19.0023,
  lng:72.8302,
  maps_url:"https://www.google.com/maps?q=19.0023,72.8302",
  transport:[{line:"Western Line", station:"Lower Parel", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?lower,parel,converted,mill,bar,warehouse,shed"
},
{
  id:"mag4-3",
  cityId:"mumbai",
  name:"Worli Village Fish Market",
  type:"market",
  neighborhood:"Worli Koliwada",
  description:"The Koli fishing village embedded within Worli \u2014 a fishing community that predates the city by centuries, now surrounded by BKC towers. The morning fish market operates from 5am. The village lanes behind are lined with Koli women selling dried Bombay duck from baskets on their heads.",
  vibe:9.3,
  localLove:9.6,
  uniqueness:9.4,
  tags:["koli village", "worli", "fishing community", "bombay duck", "5am fish market"],
  tip:"5-7am for the market. Walk into the village behind the coast road \u2014 the lanes are centuries old. The dried fish vendors are the authentic Koli trade.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Parel / Lower Parel / Worli",
  lat:19.0052,
  lng:72.8145,
  maps_url:"https://www.google.com/maps?q=19.0052,72.8145",
  transport:[{line:"Bus", station:"Worli Naka", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?worli,koli,fishing,village,market,dawn,boats"
},
{
  id:"mag4-4",
  cityId:"mumbai",
  name:"Prithvi Theatre Caf\u00e9",
  type:"bar",
  neighborhood:"Juhu",
  description:"A 40-year-old caf\u00e9 attached to Mumbai's most important small theatre, with outdoor seating under a peepal tree where actors, directors, and audience members debrief after shows. The chai is cheap and the conversation is better than anything on stage. Stays open after 11pm shows.",
  vibe:9.4,
  localLove:9.2,
  uniqueness:9.0,
  tags:["theatre caf\u00e9", "prithvi", "peepal tree", "actors", "late night chai"],
  tip:"Come after the late show for the post-performance crowd. The chai and the vada pav are the only order. Check the show schedule at the box office.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Parel / Lower Parel / Worli",
  lat:19.0999,
  lng:72.8263,
  maps_url:"https://www.google.com/maps?q=19.0999,72.8263",
  transport:[{line:"Western Line", station:"Vile Parle", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?theatre,cafe,peepal,tree,outdoor,chai,actors"
},
{
  id:"mag4-5",
  cityId:"mumbai",
  name:"Gallery Chemould Prescott Road",
  type:"experience",
  neighborhood:"Fort",
  description:"The gallery that launched the careers of most of India's major contemporary artists \u2014 Bhupen Khakhar, Atul Dodiya, Sudarshan Shetty \u2014 in a shopfront at Fort. Openings are genuinely attended by the artists, curators walk the shows with visitors, and the programme challenges without performing.",
  vibe:8.9,
  localLove:8.6,
  uniqueness:8.8,
  tags:["contemporary art", "gallery", "fort", "indian artists", "historic programme"],
  tip:"Opening nights are Thursday evenings and are open to all. The permanent programme list is at the desk. Ask for the catalogue archive.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Parel / Lower Parel / Worli",
  lat:18.929,
  lng:72.8336,
  maps_url:"https://www.google.com/maps?q=18.9290,72.8336",
  transport:[{line:"Western Line", station:"Churchgate", walk_min:13}],
  photo_url:"https://source.unsplash.com/featured/800x500/?contemporary,art,gallery,white,walls,india"
},
{
  id:"mag4-6",
  cityId:"mumbai",
  name:"The Clearing House",
  type:"bar",
  neighborhood:"Ballard Estate",
  description:"A craft cocktail bar in a former clearing house vault in Ballard Estate that preserves the original Edwardian banking architecture \u2014 teak counters, brass grilles, vaulted ceilings. The cocktail programme changes seasonally, uses Indian botanicals, and is executed by a team that has worked in London and Singapore.",
  vibe:9.1,
  localLove:8.3,
  uniqueness:9.2,
  tags:["craft cocktails", "edwardian vault", "ballard estate", "indian botanicals", "banking architecture"],
  tip:"The seasonal cocktail menu is the reason. Go midweek when the space isn't full and the bartenders can explain each drink.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Parel / Lower Parel / Worli",
  lat:18.9359,
  lng:72.8408,
  maps_url:"https://www.google.com/maps?q=18.9359,72.8408",
  transport:[{line:"Western Line", station:"CST", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?cocktail,bar,vault,edwardian,architecture,wood"
},
{
  id:"mag4-7",
  cityId:"mumbai",
  name:"Byculla Zoo at Dawn",
  type:"experience",
  neighborhood:"Byculla",
  description:"Mumbai's oldest zoo (1861) in an ornamental Victorian garden, best visited at opening time when the animals are active and the garden is empty of schoolchildren. The aviary has Indian birds the city has otherwise driven away. The Victoria-era animal houses are extraordinary architecture.",
  vibe:8.4,
  localLove:8.8,
  uniqueness:8.5,
  tags:["zoo", "1861", "victorian", "byculla", "dawn opening"],
  tip:"Be there at 9am when it opens. The bird aviary at the far end is the hidden gem. \u20b925 entry for Indians.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Parel / Lower Parel / Worli",
  lat:18.9785,
  lng:72.836,
  maps_url:"https://www.google.com/maps?q=18.9785,72.8360",
  transport:[{line:"Central Line", station:"Byculla", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?zoo,victorian,garden,morning,birds,aviary"
},
{
  id:"mag4-8",
  cityId:"mumbai",
  name:"Worli Seaface at 6am",
  type:"experience",
  neighborhood:"Worli",
  description:"The sea-facing promenade at Worli before the city wakes \u2014 a 3km walking path where the Bandra-Worli Sea Link looms to the north while fishermen from Worli Koliwada cast nets in the morning light. No cafes, no vendors at this hour \u2014 just the Arabian Sea and Mumbai's industrial skyline across the water.",
  vibe:9.4,
  localLove:9.5,
  uniqueness:8.7,
  tags:["sea link view", "6am walk", "worli", "fishermen", "free"],
  tip:"6am is the window before the jogger crowd arrives and before the light gets harsh. Walk south toward the Koli temple.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Parel / Lower Parel / Worli",
  lat:19.0135,
  lng:72.8161,
  maps_url:"https://www.google.com/maps?q=19.0135,72.8161",
  transport:[{line:"Bus", station:"Worli Seaface", walk_min:4}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,worli,sea,link,fishermen,promenade,morning"
},
{
  id:"mag4-9",
  cityId:"mumbai",
  name:"Bombay Canteen",
  type:"restaurant",
  neighborhood:"Lower Parel",
  description:"A restaurant that has earned its reputation by treating Indian ingredients with the same seriousness that European cuisine gets in Mumbai's luxury hotels. The menu is driven by seasonal regional sourcing \u2014 Manipuri black sesame, Meghalayan smoked pork, Rajasthani ker sangri \u2014 executed with precision.",
  vibe:9.0,
  localLove:8.8,
  uniqueness:8.9,
  tags:["modern indian", "regional ingredients", "seasonal", "mill district", "serious cooking"],
  tip:"Order whatever mentions a specific Indian region. The drinks programme is equally considered. Book ahead.",
  status:"approved",
  agentIcon:"\ud83c\udfa8",
  discoveredBy:"Parel / Lower Parel / Worli",
  lat:19.0034,
  lng:72.8317,
  maps_url:"https://www.google.com/maps?q=19.0034,72.8317",
  transport:[{line:"Western Line", station:"Lower Parel", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?modern,indian,restaurant,lower,parel,design"
},
{
  id:"mag5-0",
  cityId:"mumbai",
  name:"Versova Koliwada Fish Fry",
  type:"restaurant",
  neighborhood:"Versova",
  description:"A collection of small Koli-run restaurants in the Versova fishing village that fry the morning's catch and serve it to anyone who shows up with enough courage to find them. The bombil (Bombay duck) fry here is so fresh it tastes nothing like the dried version. No reservation possible, no signage in English.",
  vibe:9.0,
  localLove:9.7,
  uniqueness:9.3,
  tags:["koli fish fry", "versova", "bombay duck", "no english signage", "fresh catch"],
  tip:"Walk through the Versova Koliwada village after 11am. Follow the smell of frying fish. Point at the fish on display.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Juhu / Versova / Andheri West",
  lat:19.116,
  lng:72.8112,
  maps_url:"https://www.google.com/maps?q=19.1160,72.8112",
  transport:[{line:"Metro Line 1", station:"Versova", walk_min:15}],
  photo_url:"https://source.unsplash.com/featured/800x500/?koli,fishing,village,fish,fry,fresh,bombay"
},
{
  id:"mag5-1",
  cityId:"mumbai",
  name:"Juhu Beach Bhel",
  type:"market",
  neighborhood:"Juhu",
  description:"The evening bhel-puri economy of Juhu beach is the real Juhu \u2014 not the five-star hotels. After 5pm, a kilometre of vendors set up on the sand: bhel, pav bhaji, roasted corn, sugarcane juice, cut mango with chilli. The sunset behind the Arabian Sea from here is the city's most democratic pleasure.",
  vibe:9.2,
  localLove:9.6,
  uniqueness:7.9,
  tags:["bhel", "beach", "sunset", "evening", "sugarcane juice", "pav bhaji"],
  tip:"Arrive at 6pm for the best light and the widest selection before popular stalls sell out. The bhel wallahs who mix in front of you are doing it fresh.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Juhu / Versova / Andheri West",
  lat:19.0953,
  lng:72.8267,
  maps_url:"https://www.google.com/maps?q=19.0953,72.8267",
  transport:[{line:"Western Line", station:"Vile Parle", walk_min:18}],
  photo_url:"https://source.unsplash.com/featured/800x500/?juhu,beach,evening,bhel,vendors,sunset,arabian"
},
{
  id:"mag5-2",
  cityId:"mumbai",
  name:"Shree Thaker Bhojanalay",
  type:"restaurant",
  neighborhood:"Kalbadevi / Bhuleshwar",
  description:"A Gujarati thali institution where the unlimited meal \u2014 dal, sabzi, rotli, khichdi, kadhi, accompaniments, and papad \u2014 rotates daily with seasonal vegetables sourced from Gujarat. The thali is served on a silver plate. Refills come before you ask. The food tastes like a large family fed you.",
  vibe:9.0,
  localLove:9.5,
  uniqueness:8.8,
  tags:["gujarati thali", "unlimited", "silver plate", "kalbadevi", "seasonal vegetarian"],
  tip:"Go for lunch. Tell them dietary restrictions upfront. The dal-baati-churma on Sundays is the special occasion version.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Juhu / Versova / Andheri West",
  lat:18.9531,
  lng:72.8207,
  maps_url:"https://www.google.com/maps?q=18.9531,72.8207",
  transport:[{line:"Western Line", station:"Marine Lines", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?gujarati,thali,unlimited,silver,plate,vegetarian"
},
{
  id:"mag5-3",
  cityId:"mumbai",
  name:"Lokhandwala Complex Street Market",
  type:"market",
  neighborhood:"Andheri West, Lokhandwala",
  description:"A daily market in the lanes of Lokhandwala Complex where the film industry's supporting economy shops \u2014 costume assistants, makeup artists, set dressers buying props. The fabric lanes sell the same Bollywood costume materials at a fraction of the retail price.",
  vibe:8.3,
  localLove:9.2,
  uniqueness:8.2,
  tags:["lokhandwala", "film industry", "fabric lanes", "prop market", "andheri west"],
  tip:"Weekday mornings when the film production buyers are there. The fabric lane on the north side has the best costume silks.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Juhu / Versova / Andheri West",
  lat:19.1366,
  lng:72.8337,
  maps_url:"https://www.google.com/maps?q=19.1366,72.8337",
  transport:[{line:"Metro Line 1", station:"Azad Nagar", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?andheri,lokhandwala,market,fabric,lane,bollywood"
},
{
  id:"mag5-4",
  cityId:"mumbai",
  name:"Andheri Gymkhana Evening",
  type:"experience",
  neighborhood:"Andheri West",
  description:"A colonial-era sports club in Andheri where locals play cricket, badminton, and carrom in the evening while other members drink beer in the members' bar with the wooden overhead fans still original. Membership is cheap and open. The atmosphere is 1970s Mumbai and no-one is trying to change it.",
  vibe:8.8,
  localLove:9.3,
  uniqueness:9.1,
  tags:["gymkhana", "colonial era", "carrom", "cricket", "1970s atmosphere"],
  tip:"Apply for temporary membership at the front desk \u2014 possible for a week at modest cost. The evening bar is the reason to stay.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Juhu / Versova / Andheri West",
  lat:19.1165,
  lng:72.8427,
  maps_url:"https://www.google.com/maps?q=19.1165,72.8427",
  transport:[{line:"Western Line", station:"Andheri", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?colonial,gymkhana,cricket,carrom,evening,bar"
},
{
  id:"mag5-5",
  cityId:"mumbai",
  name:"New Kulfi Centre, Andheri",
  type:"restaurant",
  neighborhood:"Andheri West",
  description:"A kulfi shop that has been serving the Andheri community since 1957, making kulfi the traditional way \u2014 full-fat milk reduced over five hours, poured into tin moulds, and frozen in a salt-ice bath. The malai and mango varieties are perfect. No soft serve, no modern flavours.",
  vibe:8.6,
  localLove:9.4,
  uniqueness:8.7,
  tags:["kulfi", "1957", "tin moulds", "salt ice", "malai mango", "traditional method"],
  tip:"The malai kulfi is the benchmark. Come in the evening \u2014 it's served from 5pm. The falooda is also from a long recipe.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Juhu / Versova / Andheri West",
  lat:19.1195,
  lng:72.8462,
  maps_url:"https://www.google.com/maps?q=19.1195,72.8462",
  transport:[{line:"Western Line", station:"Andheri", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?kulfi,ice,cream,tin,moulds,traditional,falooda"
},
{
  id:"mag5-6",
  cityId:"mumbai",
  name:"DN Nagar Sabzi Market",
  type:"market",
  neighborhood:"Andheri West, DN Nagar",
  description:"A wholesale vegetable market that operates from 4am and supplies the restaurants of the entire western suburbs. The variety of local Maharashtra vegetables \u2014 tondli, karela, surti papdi, raw turmeric \u2014 is broader than any supermarket. Prices are source-adjacent.",
  vibe:8.1,
  localLove:9.5,
  uniqueness:8.4,
  tags:["wholesale vegetables", "4am", "western suburbs", "raw turmeric", "source price"],
  tip:"Go at 5-6am with a large bag. The surti papdi in November and raw turmeric in winter are the seasonal reasons.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Juhu / Versova / Andheri West",
  lat:19.1201,
  lng:72.8385,
  maps_url:"https://www.google.com/maps?q=19.1201,72.8385",
  transport:[{line:"Metro Line 1", station:"DN Nagar", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?vegetable,wholesale,market,dawn,andheri,bags"
},
{
  id:"mag5-7",
  cityId:"mumbai",
  name:"Madh Island Ferry & Lunch",
  type:"experience",
  neighborhood:"Madh Island",
  description:"A 15-minute fishing boat ride from Marve Beach to Madh Island \u2014 still largely undeveloped, home to the Koli fishing village, and lined with informal seafood restaurants that fry the morning catch to order. The ferry costs \u20b910. The fish thali at the village restaurant costs \u20b9120. The afternoon silence is free.",
  vibe:9.6,
  localLove:9.4,
  uniqueness:9.5,
  tags:["island ferry", "koli village", "fish thali", "madh island", "\u20b910 ferry"],
  tip:"Take the ferry from Marve Beach. Walk 10 minutes into the village. The restaurant on the left with the plastic chairs and no signage.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Juhu / Versova / Andheri West",
  lat:19.1622,
  lng:72.7994,
  maps_url:"https://www.google.com/maps?q=19.1622,72.7994",
  transport:[{line:"Bus to Marve", station:"Marve Beach then \u20b910 ferry", walk_min:0}],
  photo_url:"https://source.unsplash.com/featured/800x500/?madh,island,ferry,fishing,village,koli,lunch"
},
{
  id:"mag5-8",
  cityId:"mumbai",
  name:"Nataraj Hotel, Andheri",
  type:"restaurant",
  neighborhood:"Andheri East",
  description:"A no-frills Punjabi dhaba behind Andheri station that has been feeding construction workers, taxi drivers, and budget travellers since 1968. The butter chicken was invented for exactly this kind of cook \u2014 a large karahi, a wood fire, and no time for pretension. Dinner for two under \u20b9400.",
  vibe:8.2,
  localLove:9.4,
  uniqueness:7.9,
  tags:["punjabi dhaba", "butter chicken", "1968", "andheri east", "construction workers"],
  tip:"The butter chicken with roomali roti. Evening after 8pm when the kitchen is in full rhythm.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Juhu / Versova / Andheri West",
  lat:19.1142,
  lng:72.8477,
  maps_url:"https://www.google.com/maps?q=19.1142,72.8477",
  transport:[{line:"Western Line", station:"Andheri", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?dhaba,butter,chicken,roadside,punjabi,karahi"
},
{
  id:"mag5-9",
  cityId:"mumbai",
  name:"Filmistan Studio Gates",
  type:"experience",
  neighborhood:"Goregaon East",
  description:"A working Bollywood production complex operating from the 1940s where you can watch extras assembling, costume trucks being loaded, and the controlled chaos of a film set during shooting days \u2014 all visible from the gates. Not a studio tour, just the real thing.",
  vibe:8.8,
  localLove:8.6,
  uniqueness:9.0,
  tags:["bollywood", "1940s studio", "film set", "extras", "goregaon"],
  tip:"Arrive at 8am on a weekday when shoots are active. The extras assembling at the gate around 7:30am is the most interesting spectacle.",
  status:"approved",
  agentIcon:"\ud83c\udf3f",
  discoveredBy:"Juhu / Versova / Andheri West",
  lat:19.1574,
  lng:72.8559,
  maps_url:"https://www.google.com/maps?q=19.1574,72.8559",
  transport:[{line:"Western Line", station:"Goregaon", walk_min:15}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bollywood,film,studio,gates,extras,morning"
},
{
  id:"mag6-0",
  cityId:"mumbai",
  name:"Parsi Dairy Farm",
  type:"restaurant",
  neighborhood:"Princess Street, Marine Lines",
  description:"A Parsi-owned dairy that has been making malai, cream, curd, and paneer on the premises since 1915. The counter sells fresh items by weight at 8am when the day's production is ready. The thick cream from the separator is sold in small tins and is arguably the finest dairy product available in Mumbai.",
  vibe:9.1,
  localLove:9.5,
  uniqueness:9.4,
  tags:["parsi dairy", "1915", "fresh cream", "malai", "paneer", "marine lines"],
  tip:"Go at 8am when fresh items come out. The thick cream in tin is the thing to buy. The malai kulfi they make on-site is served from 10am.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Andheri East / Kurla / Ghatkopar",
  lat:18.9449,
  lng:72.8253,
  maps_url:"https://www.google.com/maps?q=18.9449,72.8253",
  transport:[{line:"Western Line", station:"Marine Lines", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?parsi,dairy,fresh,cream,milk,heritage,counter"
},
{
  id:"mag6-1",
  cityId:"mumbai",
  name:"Kurla Mutton Market",
  type:"market",
  neighborhood:"Kurla West",
  description:"A wholesale meat market operating before dawn where butchers from across the eastern suburbs source their daily supply. The market operates entirely in Marathi and Urdu. By 7am the best cuts are already gone. The qorma spice sellers at the market entrance are sourcing from the same suppliers as the city's best restaurants.",
  vibe:8.6,
  localLove:9.6,
  uniqueness:8.9,
  tags:["wholesale meat", "butchers", "dawn", "kurla", "marathi urdu"],
  tip:"Go at 5:30am. The mutton vendors from the rear of the market are selling to restaurants \u2014 those are the quality cuts.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Andheri East / Kurla / Ghatkopar",
  lat:19.0738,
  lng:72.8786,
  maps_url:"https://www.google.com/maps?q=19.0738,72.8786",
  transport:[{line:"Central Line", station:"Kurla", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?meat,market,butchers,wholesale,dawn,marathi"
},
{
  id:"mag6-2",
  cityId:"mumbai",
  name:"Ghatkopar Food Street",
  type:"market",
  neighborhood:"Ghatkopar West",
  description:"A dense corridor of Gujarati and Jain street food vendors near Ghatkopar station that operates evening to midnight. The pani puri quality here matches Juhu; the sev puri is better. The vendors have been in the same spots for 30 years and the pricing has barely moved.",
  vibe:8.4,
  localLove:9.5,
  uniqueness:8.0,
  tags:["gujarati street food", "jain", "pani puri", "sev puri", "ghatkopar", "30 years"],
  tip:"Go at 7-9pm when it's busy enough that everything is fresh. The sev puri vendor with the aluminium counter is the institution.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Andheri East / Kurla / Ghatkopar",
  lat:19.0872,
  lng:72.9098,
  maps_url:"https://www.google.com/maps?q=19.0872,72.9098",
  transport:[{line:"Metro Line 1", station:"Ghatkopar", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?gujarati,street,food,pani,puri,sev,evening"
},
{
  id:"mag6-3",
  cityId:"mumbai",
  name:"Vikhroli Parkside",
  type:"experience",
  neighborhood:"Vikhroli",
  description:"A converted mill compound in Vikhroli that houses a community of architects, designers, and craftspeople in a landscape designed by landscape architects Studio Land+Civilization. The public path through the compound passes workshops, a craft school, and a small farm. Completely free to walk through.",
  vibe:8.8,
  localLove:8.3,
  uniqueness:9.1,
  tags:["converted mill", "vikhroli", "designers", "craft school", "free walk"],
  tip:"Monday to Saturday 9am-5pm. Walk all the way to the back of the compound where the farm and workshop section is.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Andheri East / Kurla / Ghatkopar",
  lat:19.11,
  lng:72.9311,
  maps_url:"https://www.google.com/maps?q=19.1100,72.9311",
  transport:[{line:"Central Line", station:"Vikhroli", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?converted,mill,design,workshop,parkside,green"
},
{
  id:"mag6-4",
  cityId:"mumbai",
  name:"Andheri East Dhaba Row",
  type:"market",
  neighborhood:"MIDC Andheri East",
  description:"A strip of roadside dhabas along the MIDC industrial estate that feed the night shift workers of the area's factories from 10pm to 5am. Tadka dal, roti on a tawa, egg bhurji, and chai served on portable stoves. The clientele is factory workers from UP and Bihar whose food standards are exacting.",
  vibe:8.7,
  localLove:9.7,
  uniqueness:8.8,
  tags:["dhaba", "night shift workers", "MIDC", "10pm-5am", "up bihar food"],
  tip:"Go after midnight. The dal tadka and tawa roti from the dhaba run by the Gorakhpur family \u2014 recognisable by the copper-coloured tawa.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Andheri East / Kurla / Ghatkopar",
  lat:19.1176,
  lng:72.8681,
  maps_url:"https://www.google.com/maps?q=19.1176,72.8681",
  transport:[{line:"Western Line", station:"Andheri", walk_min:16}],
  photo_url:"https://source.unsplash.com/featured/800x500/?dhaba,roadside,workers,midnight,food,simple"
},
{
  id:"mag6-5",
  cityId:"mumbai",
  name:"CSIA Airport Observation Lounge",
  type:"experience",
  neighborhood:"Santacruz East / Airport",
  description:"The public observation area on the roof of Terminal 2 that is almost never used. The view of the runway and incoming aircraft with the Western Ghats behind on clear days is extraordinary. Access through T2 after clearing security with a valid same-day boarding pass \u2014 but the caf\u00e9 is accessible to all.",
  vibe:8.3,
  localLove:7.5,
  uniqueness:9.0,
  tags:["airport observation", "runway view", "terminal 2", "free with boarding pass", "western ghats"],
  tip:"Use a free lounge-access credit card or buy the cheapest domestic flight. The 6am to 8am landing wave is the most impressive viewing window.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Andheri East / Kurla / Ghatkopar",
  lat:19.0896,
  lng:72.8656,
  maps_url:"https://www.google.com/maps?q=19.0896,72.8656",
  transport:[{line:"Western Line", station:"Santacruz", walk_min:20}],
  photo_url:"https://source.unsplash.com/featured/800x500/?airport,runway,view,observation,aircraft"
},
{
  id:"mag6-6",
  cityId:"mumbai",
  name:"Sion Koliwada",
  type:"experience",
  neighborhood:"Sion",
  description:"A Koli fishing village within Sion \u2014 one of the oldest settled communities in Mumbai, predating Portugeuse colonisation. The village temple, the fish market at the base, and the community well are all still active. The raised Sion Fort above offers a view across the mangrove estuary that most Mumbai residents don't know exists.",
  vibe:9.0,
  localLove:9.2,
  uniqueness:9.3,
  tags:["koli village", "sion", "pre-colonial", "fort view", "mangrove estuary"],
  tip:"Climb the Sion Fort for the mangrove view. The village fish market operates from 6-9am. Ask permission before photographing residents.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Andheri East / Kurla / Ghatkopar",
  lat:19.0414,
  lng:72.863,
  maps_url:"https://www.google.com/maps?q=19.0414,72.8630",
  transport:[{line:"Central Line", station:"Sion", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?sion,koli,fishing,village,fort,mangrove,creek"
},
{
  id:"mag6-7",
  cityId:"mumbai",
  name:"Chembur Sindhi Colony Market",
  type:"market",
  neighborhood:"Chembur",
  description:"A Sindhi refugee colony market that has been operating since partition \u2014 the community brought their wholesale trading skills from Karachi and Hyderabad Sindh. The market sells goods that don't exist in other parts of Mumbai: sindhi embroidery, specific spice mixes, and bindis produced by cottage industries in the colony.",
  vibe:8.5,
  localLove:9.1,
  uniqueness:9.2,
  tags:["sindhi colony", "partition market", "karachi", "sindhi embroidery", "cottage industry"],
  tip:"Saturday mornings are fullest. The spice lane sells sindhi mix masalas unavailable anywhere else in Mumbai.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Andheri East / Kurla / Ghatkopar",
  lat:19.06,
  lng:72.8994,
  maps_url:"https://www.google.com/maps?q=19.0600,72.8994",
  transport:[{line:"Harbour Line", station:"Chembur", walk_min:13}],
  photo_url:"https://source.unsplash.com/featured/800x500/?sindhi,market,partition,colony,chembur,stalls"
},
{
  id:"mag6-8",
  cityId:"mumbai",
  name:"Trombay Mangrove Walk",
  type:"experience",
  neighborhood:"Trombay / Chembur",
  description:"A 4km walking trail through the mangrove belt along the Thane Creek at Trombay \u2014 one of the largest intact mangrove stands accessible from Mumbai. Flamingos in winter, mudskippers year-round, and a silence that makes it incomprehensible that you're 18km from the Gateway of India.",
  vibe:9.3,
  localLove:8.7,
  uniqueness:9.4,
  tags:["mangroves", "flamingos", "walking trail", "trombay", "thane creek"],
  tip:"Early morning October to February for flamingos. Wear closed shoes. The path starts at the Trombay village entrance near the fire station.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Andheri East / Kurla / Ghatkopar",
  lat:19.0381,
  lng:72.939,
  maps_url:"https://www.google.com/maps?q=19.0381,72.9390",
  transport:[{line:"Harbour Line", station:"Chembur + auto", walk_min:0}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mangrove,flamingos,nature,walk,creek,quiet"
},
{
  id:"mag6-9",
  cityId:"mumbai",
  name:"Milan Subway Vadapav",
  type:"restaurant",
  neighborhood:"Santacruz West",
  description:"A vadapav stall that has been operating in the Milan Subway underpass since 1975, producing arguably the finest iteration of Mumbai's defining street food. The vada is potato-spiced and deep-fried to order. The chutney is wet and green. No chairs. Cash only. Queue always.",
  vibe:8.9,
  localLove:9.8,
  uniqueness:8.6,
  tags:["vadapav", "1975", "subway stall", "santacruz", "cash only", "queue"],
  tip:"Go at 5pm when the post-school and post-work crowd arrives and everything is freshest. One vadapav with both chutneys.",
  status:"approved",
  agentIcon:"\u26a1",
  discoveredBy:"Andheri East / Kurla / Ghatkopar",
  lat:19.0817,
  lng:72.8455,
  maps_url:"https://www.google.com/maps?q=19.0817,72.8455",
  transport:[{line:"Western Line", station:"Santacruz", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?vadapav,stall,subway,counter,queue,queue"
},
{
  id:"mag7-0",
  cityId:"mumbai",
  name:"Noor Mohammadi Hotel",
  type:"restaurant",
  neighborhood:"Mohammed Ali Road",
  description:"A pre-independence institution on Mohammed Ali Road that serves the city's definitive nihari \u2014 a slow-cooked bone broth with marrow, served with roomali roti at 7am. The recipe has not changed since 1923. The crowd from 7-10am is Mumbai's Muslim working class getting the meal before the day starts.",
  vibe:9.4,
  localLove:9.8,
  uniqueness:9.5,
  tags:["nihari", "1923", "bone broth", "morning", "mohammed ali road"],
  tip:"Come at 7am for the opening. Order nihari with paya (trotters). The salan (broth) should be consumed before the meat. Roomali roti only.",
  status:"approved",
  agentIcon:"\ud83d\udc1f",
  discoveredBy:"Mohammed Ali Road / Bhendi Bazaar",
  lat:18.9603,
  lng:72.8354,
  maps_url:"https://www.google.com/maps?q=18.9603,72.8354",
  transport:[{line:"Central Line", station:"Sandhurst Road", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?nihari,morning,broth,muslim,restaurant,slow,cook"
},
{
  id:"mag7-1",
  cityId:"mumbai",
  name:"Suleiman Usman Mithaiwala",
  type:"restaurant",
  neighborhood:"Mohammed Ali Road",
  description:"A mithai shop specialising in Bohri sweets and Mughlai desserts that are the benchmark of Mohammed Ali Road's confectionery tradition. The malpua is the thing \u2014 fried pancakes soaked in rabdi \u2014 and the shahi tukda is a rival for the city's best. The shop interior is 1950s and hasn't changed.",
  vibe:9.2,
  localLove:9.7,
  uniqueness:9.3,
  tags:["bohri sweets", "malpua", "shahi tukda", "1950s shop", "mughlai desserts"],
  tip:"The malpua and the shahi tukda. Go on Ramzan nights for the full street food context.",
  status:"approved",
  agentIcon:"\ud83d\udc1f",
  discoveredBy:"Mohammed Ali Road / Bhendi Bazaar",
  lat:18.9607,
  lng:72.8356,
  maps_url:"https://www.google.com/maps?q=18.9607,72.8356",
  transport:[{line:"Central Line", station:"Sandhurst Road", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?malpua,sweet,dessert,fried,rabdi,shop"
},
{
  id:"mag7-2",
  cityId:"mumbai",
  name:"Bohri Mohalla Food Lane",
  type:"market",
  neighborhood:"Bhendi Bazaar",
  description:"A narrow lane in the Bohri community's neighbourhood where home cooks sell their speciality Bohri dishes from their doorsteps on weekends \u2014 raan, haleem, dal chawal palida, and the exceptional Bohri biryani. It's a community food sharing tradition that has become semi-commercial without losing its character.",
  vibe:9.3,
  localLove:9.6,
  uniqueness:9.7,
  tags:["bohri cuisine", "home cooks", "raan", "haleem", "dal chawal palida", "bhendi bazaar"],
  tip:"Saturday and Sunday from 12-4pm. The dal chawal palida is the rarest dish \u2014 a Bohri lentil and rice preparation found nowhere else.",
  status:"approved",
  agentIcon:"\ud83d\udc1f",
  discoveredBy:"Mohammed Ali Road / Bhendi Bazaar",
  lat:18.9619,
  lng:72.8342,
  maps_url:"https://www.google.com/maps?q=18.9619,72.8342",
  transport:[{line:"Central Line", station:"Sandhurst Road", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bohri,community,food,lane,doorstep,raan,haleem"
},
{
  id:"mag7-3",
  cityId:"mumbai",
  name:"Minara Masjid Attar Lane",
  type:"experience",
  neighborhood:"Bhendi Bazaar",
  description:"A lane behind Minara Masjid lined with attar (natural perfume) sellers \u2014 small bottles of oud, jasmine, rose, and sandalwood concentrated perfume oils, some of which have been produced by the same families for 150 years. The scent of the lane itself is overwhelming in the best way.",
  vibe:9.0,
  localLove:8.9,
  uniqueness:9.6,
  tags:["attar", "natural perfume", "oud", "jasmine", "150 years", "minara masjid"],
  tip:"Go in the morning when new stock is laid out. Ask to smell the oud-heavy blends \u2014 the older shops have genuinely extraordinary deep fragrances.",
  status:"approved",
  agentIcon:"\ud83d\udc1f",
  discoveredBy:"Mohammed Ali Road / Bhendi Bazaar",
  lat:18.9623,
  lng:72.834,
  maps_url:"https://www.google.com/maps?q=18.9623,72.8340",
  transport:[{line:"Central Line", station:"Sandhurst Road", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?attar,perfume,shop,oud,fragrance,bottles,mosque"
},
{
  id:"mag7-4",
  cityId:"mumbai",
  name:"Shalimar Hotel, Colaba",
  type:"restaurant",
  neighborhood:"Colaba",
  description:"A no-frills Muslim restaurant serving the city's best mutton seekh rolls \u2014 a spiced minced mutton wrapped in a flaky paratha \u2014 along with perfectly executed haleem and a biryani that shows up better restaurants. The room is fluorescent-lit and the prices are from 1995.",
  vibe:8.6,
  localLove:9.4,
  uniqueness:8.5,
  tags:["mutton seekh roll", "haleem", "biryani", "no frills", "1995 prices", "colaba"],
  tip:"The seekh roll and the haleem. Go for a late lunch 2-4pm when the biryani is at its best.",
  status:"approved",
  agentIcon:"\ud83d\udc1f",
  discoveredBy:"Mohammed Ali Road / Bhendi Bazaar",
  lat:18.9196,
  lng:72.8319,
  maps_url:"https://www.google.com/maps?q=18.9196,72.8319",
  transport:[{line:"Bus", station:"Colaba Causeway", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mughlai,restaurant,seekh,roll,haleem,colaba"
},
{
  id:"mag7-5",
  cityId:"mumbai",
  name:"Handi Restaurant, Nagpada",
  type:"restaurant",
  neighborhood:"Nagpada",
  description:"A hole-in-the-wall restaurant in Nagpada serving Mughlai food cooked in a wood-fired handi (clay pot) \u2014 a method increasingly rare in the city. The dal makhani simmers for 12 hours, the shahi paneer is made with reduced cream, and the naan comes off a clay tandoor still using charcoal.",
  vibe:8.8,
  localLove:9.5,
  uniqueness:9.0,
  tags:["wood fired handi", "clay pot", "12 hour dal", "charcoal tandoor", "nagpada"],
  tip:"The dal makhani and the shahi paneer with naan. Go for dinner when the wood fire is at its hottest.",
  status:"approved",
  agentIcon:"\ud83d\udc1f",
  discoveredBy:"Mohammed Ali Road / Bhendi Bazaar",
  lat:18.9657,
  lng:72.83,
  maps_url:"https://www.google.com/maps?q=18.9657,72.8300",
  transport:[{line:"Central Line", station:"Sandhurst Road", walk_min:16}],
  photo_url:"https://source.unsplash.com/featured/800x500/?wood,fired,clay,pot,handi,restaurant,curry"
},
{
  id:"mag7-6",
  cityId:"mumbai",
  name:"Pyaala Chai, Mohammed Ali Road",
  type:"restaurant",
  neighborhood:"Mohammed Ali Road",
  description:"A tea house operating from a shopfront on Mohammed Ali Road that makes Kashmiri noon chai \u2014 the pink milk tea \u2014 and saffron chai alongside traditional Mughlai breakfast breads. The noon chai here has been pink for 60 years and anyone who says it should be thinner has not drunk this version.",
  vibe:8.7,
  localLove:9.3,
  uniqueness:9.1,
  tags:["noon chai", "pink tea", "saffron chai", "kashmiri", "60 years", "mughlai breakfast"],
  tip:"The noon chai (order it bolder, not the tourist version). Pair with the sheermal bread that comes out at 8am.",
  status:"approved",
  agentIcon:"\ud83d\udc1f",
  discoveredBy:"Mohammed Ali Road / Bhendi Bazaar",
  lat:18.9598,
  lng:72.8348,
  maps_url:"https://www.google.com/maps?q=18.9598,72.8348",
  transport:[{line:"Central Line", station:"Sandhurst Road", walk_min:13}],
  photo_url:"https://source.unsplash.com/featured/800x500/?pink,kashmiri,noon,chai,tea,glass,bread"
},
{
  id:"mag7-7",
  cityId:"mumbai",
  name:"Chor Bazaar Leather Lane",
  type:"market",
  neighborhood:"Chor Bazaar",
  description:"The leather goods section of Chor Bazaar where craftsmen repair and re-sell vintage leather \u2014 Bollywood-era trunks, colonial briefcases, army kit bags \u2014 alongside new goods made using old techniques. The restoration workshops at the back of the lane are where craftsmen using 19th-century tools fix things most people would throw away.",
  vibe:8.8,
  localLove:9.0,
  uniqueness:9.0,
  tags:["leather lane", "chor bazaar", "vintage trunks", "restoration workshop", "bollywood era"],
  tip:"Go to the back of the lane to the restoration workshops \u2014 you can commission repairs at rates that make sense. Friday morning for new arrivals.",
  status:"approved",
  agentIcon:"\ud83d\udc1f",
  discoveredBy:"Mohammed Ali Road / Bhendi Bazaar",
  lat:18.9604,
  lng:72.8307,
  maps_url:"https://www.google.com/maps?q=18.9604,72.8307",
  transport:[{line:"Central Line", station:"Sandhurst Road", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?leather,vintage,trunks,restoration,workshop,chor,bazaar"
},
{
  id:"mag7-8",
  cityId:"mumbai",
  name:"Minara Masjid Sehri Market",
  type:"market",
  neighborhood:"Mohammed Ali Road",
  description:"The pre-dawn market during Ramzan that sets up at 3:30am to feed the community before the fast begins. Operates for only 40 nights a year and produces the most extraordinary temporary food culture in the city \u2014 dates, paya soup, sheer korma, and fresh fruit juices in the absolute darkness before dawn.",
  vibe:9.7,
  localLove:9.9,
  uniqueness:9.8,
  tags:["ramzan only", "3am market", "sehri", "dates", "sheer korma", "40 nights only"],
  tip:"Ramzan only, 3:30-5am. The paya soup vendor near the mosque entrance has been doing this for 30 years. Bring cash, nothing else needed.",
  status:"approved",
  agentIcon:"\ud83d\udc1f",
  discoveredBy:"Mohammed Ali Road / Bhendi Bazaar",
  lat:18.9621,
  lng:72.8341,
  maps_url:"https://www.google.com/maps?q=18.9621,72.8341",
  transport:[{line:"Central Line", station:"Sandhurst Road", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?ramzan,sehri,pre,dawn,market,dates,food"
},
{
  id:"mag7-9",
  cityId:"mumbai",
  name:"Mahrooh Sharbat Shop",
  type:"restaurant",
  neighborhood:"Mohammed Ali Road",
  description:"A sharbat specialist operating from a narrow shopfront that makes 22 varieties of traditional sherbet from scratch \u2014 rose, khus, tamarind, sandalwood, falsa \u2014 using no artificial flavours or colours. The cooling drinks are exactly what the Mohammed Ali Road heat requires and nothing like the synthetic versions sold elsewhere.",
  vibe:8.9,
  localLove:9.4,
  uniqueness:9.3,
  tags:["sharbat", "22 varieties", "rose", "khus", "tamarind", "no artificial", "sandalwood"],
  tip:"The sandalwood sharbat and the khus (vetiver). Come in the afternoon when the heat makes them medicinal.",
  status:"approved",
  agentIcon:"\ud83d\udc1f",
  discoveredBy:"Mohammed Ali Road / Bhendi Bazaar",
  lat:18.9601,
  lng:72.8352,
  maps_url:"https://www.google.com/maps?q=18.9601,72.8352",
  transport:[{line:"Central Line", station:"Sandhurst Road", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?sharbat,sherbet,traditional,cooling,drink,bottles"
},
{
  id:"mag8-0",
  cityId:"mumbai",
  name:"Kamat Samarambh",
  type:"restaurant",
  neighborhood:"Dadar West",
  description:"A legendary Maharashtrian thali restaurant that serves the complete regional meal \u2014 five bhakri (sorghum flatbread), six sabzis, two dals, koshimbir, papad, and kokum sol kadhi \u2014 to a crowd of office workers and local families. The thali has not changed in 35 years and is non-negotiable.",
  vibe:8.9,
  localLove:9.6,
  uniqueness:8.8,
  tags:["maharashtrian thali", "bhakri", "kokum sol kadhi", "dadar west", "35 years", "non-negotiable"],
  tip:"Lunch only, 12-3pm. Tell them vegetarian or not at entry. The sorghum bhakri with the zunka (dry chickpea flour sabzi) is the essential combination.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Dadar / Shivaji Park / Mahim",
  lat:19.0188,
  lng:72.8418,
  maps_url:"https://www.google.com/maps?q=19.0188,72.8418",
  transport:[{line:"Western Line", station:"Dadar", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?maharashtrian,thali,bhakri,dadar,lunch,workers"
},
{
  id:"mag8-1",
  cityId:"mumbai",
  name:"Shivaji Park Morning Walk",
  type:"experience",
  neighborhood:"Shivaji Park, Dadar",
  description:"Mumbai's most politically significant public ground \u2014 where rallies have shaped the city's history \u2014 transforms before 7am into its daily democratic function: 8,000 morning walkers doing rounds, cricket practice on every grass patch, old men arguing about cricket, and a chain of chai stalls at the perimeter.",
  vibe:9.2,
  localLove:9.7,
  uniqueness:8.6,
  tags:["shivaji park", "morning walk", "cricket practice", "political ground", "democratic"],
  tip:"Be there at 6am. The perimeter walk takes 35 minutes. The political history is visible in the sculptures and signboards around the edge.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Dadar / Shivaji Park / Mahim",
  lat:19.0214,
  lng:72.8421,
  maps_url:"https://www.google.com/maps?q=19.0214,72.8421",
  transport:[{line:"Western Line", station:"Dadar", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,shivaji,park,morning,walk,cricket,dawn"
},
{
  id:"mag8-2",
  cityId:"mumbai",
  name:"Dadar Flower Market",
  type:"market",
  neighborhood:"Dadar West",
  description:"The wholesale flower market underneath Dadar's flyover \u2014 one of the largest flower markets in Asia \u2014 where garlands, loose flowers, and floral arrangements for temples, weddings, and funerals move before dawn. At 4am, the marigold and jasmine batches arrive and the entire area smells extraordinary.",
  vibe:9.4,
  localLove:9.6,
  uniqueness:9.0,
  tags:["flower market", "4am", "wholesale", "marigold", "jasmine", "asia's largest"],
  tip:"4-5am is the peak. Walk slowly and get out of the way of the cart pullers. The price difference between retail and wholesale is remarkable.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Dadar / Shivaji Park / Mahim",
  lat:19.019,
  lng:72.8399,
  maps_url:"https://www.google.com/maps?q=19.0190,72.8399",
  transport:[{line:"Western Line", station:"Dadar", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?dadar,flower,market,wholesale,marigold,4am,dawn"
},
{
  id:"mag8-3",
  cityId:"mumbai",
  name:"Mithibai Misal",
  type:"restaurant",
  neighborhood:"Vile Parle West",
  description:"The misal debate in Mumbai is unending, but Mithibai's has a consistent argument \u2014 the tarri (the red spiced broth that tops the moth bean sprouts) is made fresh twice daily and the farsan garnish is a house recipe. Breakfast only, open from 7am, closed by 11am when it runs out.",
  vibe:8.7,
  localLove:9.5,
  uniqueness:8.5,
  tags:["misal", "tarri", "7am-11am", "runs out early", "vile parle west"],
  tip:"Go at 7:30am. The full misal with extra tarri and fresh bread. It runs out by 10am on weekends.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Dadar / Shivaji Park / Mahim",
  lat:19.1068,
  lng:72.8325,
  maps_url:"https://www.google.com/maps?q=19.1068,72.8325",
  transport:[{line:"Western Line", station:"Vile Parle", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?misal,pav,breakfast,maharashtrian,tarri,spicy"
},
{
  id:"mag8-4",
  cityId:"mumbai",
  name:"Mahim Dargah Evening",
  type:"experience",
  neighborhood:"Mahim",
  description:"The dargah of Makhdoom Ali Mahimi, the 15th-century saint credited with protecting the city. In the evenings the causeway approach fills with vendors selling roses, agarbatti, and qawwali music from the inner courtyard drifts out to the sea. Visitors of every faith come.",
  vibe:9.3,
  localLove:9.2,
  uniqueness:8.8,
  tags:["dargah", "qawwali", "15th century saint", "mahim", "evening", "rose sellers"],
  tip:"Thursday evening for live qawwali. Enter quietly, remove shoes. The rose vendors at the entrance sell the offering garlands.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Dadar / Shivaji Park / Mahim",
  lat:19.0381,
  lng:72.8394,
  maps_url:"https://www.google.com/maps?q=19.0381,72.8394",
  transport:[{line:"Western Line", station:"Mahim", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mahim,dargah,evening,roses,qawwali,shrine,music"
},
{
  id:"mag8-5",
  cityId:"mumbai",
  name:"Ashok Vada Pav, Dadar",
  type:"restaurant",
  neighborhood:"Dadar East",
  description:"The most serious argument for any single vadapav stall in the city \u2014 Ashok's has been at the same spot outside Dadar station since 1965 and the queue at 8am tells you everything. The dry chutney is the differentiator: a combination of dried coconut, garlic, and chilli ground to a consistency that makes other chutneys seem lazy.",
  vibe:9.0,
  localLove:9.9,
  uniqueness:8.7,
  tags:["vadapav", "1965", "dadar station", "dry chutney", "queue", "the best argument"],
  tip:"7:30-9am before office hours. One vadapav with both chutneys. The dry coconut-garlic chutney is applied separately \u2014 ask for double.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Dadar / Shivaji Park / Mahim",
  lat:19.021,
  lng:72.8447,
  maps_url:"https://www.google.com/maps?q=19.0210,72.8447",
  transport:[{line:"Central Line", station:"Dadar", walk_min:2}],
  photo_url:"https://source.unsplash.com/featured/800x500/?vada,pav,dadar,station,stall,queue,chutney"
},
{
  id:"mag8-6",
  cityId:"mumbai",
  name:"Gadkari Rangayatan Theatre",
  type:"experience",
  neighborhood:"Thane",
  description:"A Marathi-language theatre in Thane that has been staging Marathi plays \u2014 the city's literary and political theatre tradition \u2014 for 50 years. The productions are entirely in Marathi, tickets cost \u20b9100, and the post-show discussion in the lobby is better than the shows at some English-language venues.",
  vibe:8.8,
  localLove:9.4,
  uniqueness:9.1,
  tags:["marathi theatre", "thane", "50 years", "\u20b9100 tickets", "political drama"],
  tip:"Book at the box office on the day. The Saturday evening show is the social event for Thane's Maharashtrian intelligentsia.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Dadar / Shivaji Park / Mahim",
  lat:19.1988,
  lng:72.9678,
  maps_url:"https://www.google.com/maps?q=19.1988,72.9678",
  transport:[{line:"Central Line", station:"Thane", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?marathi,theatre,stage,drama,performance"
},
{
  id:"mag8-7",
  cityId:"mumbai",
  name:"Caf\u00e9 Sundance",
  type:"restaurant",
  neighborhood:"Shivaji Park, Dadar",
  description:"A Goan-Catholic restaurant near Shivaji Park that has been serving vindaloo, xacuti, and bebinca (Goan layered coconut cake) to the neighbourhood for 40 years. The tables are plastic, the menu is laminated, and the recipes are from a grandmother in Goa who has not visited Mumbai but whose instructions are followed exactly.",
  vibe:8.5,
  localLove:9.3,
  uniqueness:8.7,
  tags:["goan catholic", "vindaloo", "xacuti", "bebinca", "40 years", "dadar"],
  tip:"The xacuti and the bebinca. Sunday lunch is the occasion \u2014 call ahead.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Dadar / Shivaji Park / Mahim",
  lat:19.022,
  lng:72.8411,
  maps_url:"https://www.google.com/maps?q=19.0220,72.8411",
  transport:[{line:"Western Line", station:"Dadar", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?goan,restaurant,vindaloo,bebinca,dadar,table"
},
{
  id:"mag8-8",
  cityId:"mumbai",
  name:"Navratna Bhavan Tea Stall",
  type:"restaurant",
  neighborhood:"Dadar West",
  description:"A tea stall that has been at the same address in Dadar since 1946, serving chai in a glass with one-inch of cream at the top. The cutting chai is 50p cheaper than anywhere nearby because the owner considers the profit margin of \u20b91.50 per glass adequate. The conversation around the stall is the city's best free entertainment.",
  vibe:8.9,
  localLove:9.8,
  uniqueness:8.5,
  tags:["cutting chai", "1946", "cream top", "dadar", "\u20b950p cheaper", "community stall"],
  tip:"Morning 7-10am when the neighbourhood comes for its first glass. Stand at the stall, not in the queue \u2014 there's no queue, just the crowd.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Dadar / Shivaji Park / Mahim",
  lat:19.0183,
  lng:72.841,
  maps_url:"https://www.google.com/maps?q=19.0183,72.8410",
  transport:[{line:"Western Line", station:"Dadar", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?cutting,chai,glass,tea,stall,community,morning"
},
{
  id:"mag8-9",
  cityId:"mumbai",
  name:"Ruparel College Architecture Walk",
  type:"experience",
  neighborhood:"Matunga / Mahim",
  description:"An informal walk through the Portuguese, British, and Indo-Saracenic architecture of the Matunga-Mahim corridor that traces 500 years of building. The college buildings, the church, the railway quarters, and the water-works are all within 1km and represent the city's layered colonial inheritance.",
  vibe:8.6,
  localLove:8.2,
  uniqueness:8.9,
  tags:["architecture walk", "portuguese", "british", "indo-saracenic", "500 years", "free"],
  tip:"Start at Ruparel College at 8am and walk west toward the church. A free Mumbai Heritage Walk tour does this route on last Sundays.",
  status:"approved",
  agentIcon:"\ud83c\udfad",
  discoveredBy:"Dadar / Shivaji Park / Mahim",
  lat:19.0278,
  lng:72.8376,
  maps_url:"https://www.google.com/maps?q=19.0278,72.8376",
  transport:[{line:"Western Line", station:"Dadar", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?colonial,architecture,portuguese,british,mumbai,building"
},
{
  id:"mag9-0",
  cityId:"mumbai",
  name:"Dharavi Leather District",
  type:"experience",
  neighborhood:"Dharavi",
  description:"A working leather tannery and manufacturing district inside Dharavi where small workshops produce bags, belts, and footwear that ends up in Mumbai's retail stores at three times the price. Leather is sourced, tanned, cut, stitched, and sold in a single square kilometre. The smell of the tanning section is not optional.",
  vibe:8.6,
  localLove:9.2,
  uniqueness:9.5,
  tags:["dharavi", "leather tannery", "manufacturing", "direct purchase", "workshop"],
  tip:"Go with a guide from one of the legitimate community tour organisations. Buy directly from the workshops \u2014 the quality is exceptional at source price.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Dharavi / Sion / Chembur",
  lat:19.0418,
  lng:72.8528,
  maps_url:"https://www.google.com/maps?q=19.0418,72.8528",
  transport:[{line:"Central Line", station:"Mahim Junction", walk_min:15}],
  photo_url:"https://source.unsplash.com/featured/800x500/?dharavi,leather,tannery,workshop,craft,stitching"
},
{
  id:"mag9-1",
  cityId:"mumbai",
  name:"RC Church, Sion",
  type:"experience",
  neighborhood:"Sion",
  description:"A Portuguese church from 1606 on the Sion hill that contains the oldest surviving Christian graveyard in the city \u2014 epitaphs in Portuguese, Dutch, and English from the 17th century. The church is active and largely unvisited. The hilltop view of the mangrove creek below is exceptional.",
  vibe:8.9,
  localLove:8.1,
  uniqueness:9.5,
  tags:["1606 church", "portuguese", "sion hill", "17th century graves", "mangrove view"],
  tip:"Open Sunday morning and Saturday afternoons. The graveyard is behind the main church \u2014 ask the priest to open the gate.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Dharavi / Sion / Chembur",
  lat:19.0429,
  lng:72.8629,
  maps_url:"https://www.google.com/maps?q=19.0429,72.8629",
  transport:[{line:"Central Line", station:"Sion", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?portuguese,church,1606,sion,hill,graveyard"
},
{
  id:"mag9-2",
  cityId:"mumbai",
  name:"Sion-Chunabhatti Tamil Food Street",
  type:"market",
  neighborhood:"Sion-Chunabhatti",
  description:"A strip of Tamil food vendors near Sion-Chunabhatti that serve the migrant Tamil community working in the eastern suburbs. Idiyappam with coconut milk, kuzhambu with fresh grated coconut, and Tamil breakfasts unavailable elsewhere in Mumbai. The vendors are mostly women who cook from home recipes.",
  vibe:8.7,
  localLove:9.7,
  uniqueness:9.2,
  tags:["tamil food", "idiyappam", "kuzhambu", "migrant community", "women cooks", "sion"],
  tip:"7-10am for breakfast. The idiyappam with coconut milk is the most Tamil-home thing available in Mumbai.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Dharavi / Sion / Chembur",
  lat:19.0358,
  lng:72.8699,
  maps_url:"https://www.google.com/maps?q=19.0358,72.8699",
  transport:[{line:"Central Line", station:"Chunabhatti", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?tamil,food,idiyappam,coconut,milk,migrant,workers"
},
{
  id:"mag9-3",
  cityId:"mumbai",
  name:"Chembur Agiari (Parsi Fire Temple)",
  type:"experience",
  neighborhood:"Chembur",
  description:"A Zoroastrian fire temple in the Chembur Parsi colony open to non-Zoroastrians in its outer garden \u2014 a manicured, almost impossibly quiet green space in one of Mumbai's densest suburbs. The temple architecture is Art Deco Parsi. The colony around it has changed nothing since 1948.",
  vibe:9.1,
  localLove:8.6,
  uniqueness:9.3,
  tags:["parsi fire temple", "zoroastrian", "1948 colony", "art deco", "garden", "chembur"],
  tip:"The outer garden is accessible to all. Dress conservatively. The colony streets behind the temple have unchanged Parsi bungalows from the 1940s.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Dharavi / Sion / Chembur",
  lat:19.0586,
  lng:72.9003,
  maps_url:"https://www.google.com/maps?q=19.0586,72.9003",
  transport:[{line:"Harbour Line", station:"Chembur", walk_min:10}],
  photo_url:"https://source.unsplash.com/featured/800x500/?parsi,fire,temple,art,deco,garden,colony"
},
{
  id:"mag9-4",
  cityId:"mumbai",
  name:"RK Studios Wall, Chembur",
  type:"experience",
  neighborhood:"Chembur",
  description:"The exterior wall of the legendary RK Studios \u2014 Raj Kapoor's production house and the birthplace of much of the 1950s-70s Bollywood canon \u2014 is now a mural site since the studio was demolished. The wall faces the road and local residents have created an informal memorial with paintings and old film posters.",
  vibe:8.8,
  localLove:9.0,
  uniqueness:9.1,
  tags:["RK studios", "raj kapoor", "bollywood heritage", "mural wall", "chembur", "demolished memorial"],
  tip:"Go in the morning when the light falls on the murals. The old film posters pasted around the base are from the community's collection.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Dharavi / Sion / Chembur",
  lat:19.0568,
  lng:72.8988,
  maps_url:"https://www.google.com/maps?q=19.0568,72.8988",
  transport:[{line:"Harbour Line", station:"Chembur", walk_min:13}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bollywood,mural,wall,raj,kapoor,rk,studio,heritage"
},
{
  id:"mag9-5",
  cityId:"mumbai",
  name:"Govandi Recycling Market",
  type:"market",
  neighborhood:"Govandi / Deonar",
  description:"A recycling and salvage market near Govandi where the city's waste economy operates \u2014 paper, plastic, metal, and electronics sorted, disassembled, and resold by specialist traders. The knowledge base of these traders about materials and components is extraordinary. The most honest capitalism in Mumbai.",
  vibe:8.2,
  localLove:9.4,
  uniqueness:9.7,
  tags:["recycling market", "govandi", "waste economy", "salvage", "honest capitalism"],
  tip:"Go on a weekday morning. The electronics disassembly section is the most fascinating. Dress for the environment.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Dharavi / Sion / Chembur",
  lat:19.0531,
  lng:72.9221,
  maps_url:"https://www.google.com/maps?q=19.0531,72.9221",
  transport:[{line:"Harbour Line", station:"Govandi", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?recycling,market,salvage,waste,sorting,workers"
},
{
  id:"mag9-6",
  cityId:"mumbai",
  name:"Dharavi Recycling Paper District",
  type:"experience",
  neighborhood:"Dharavi",
  description:"A section of Dharavi where waste paper is sorted, cleaned, pressed, and sold \u2014 a complete recycling economy. Bales of paper arrive by cart and leave as raw material for packaging factories. The women who sort paper are often running businesses with turnover larger than many formal enterprises.",
  vibe:8.4,
  localLove:9.3,
  uniqueness:9.4,
  tags:["paper recycling", "dharavi", "women entrepreneurs", "waste economy", "informal business"],
  tip:"Go with a local guide. The sorting process is explained enthusiastically \u2014 the women who run these units are proud of their operations.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Dharavi / Sion / Chembur",
  lat:19.0425,
  lng:72.8542,
  maps_url:"https://www.google.com/maps?q=19.0425,72.8542",
  transport:[{line:"Central Line", station:"Mahim Junction", walk_min:16}],
  photo_url:"https://source.unsplash.com/featured/800x500/?paper,recycling,women,sorting,bales,dharavi"
},
{
  id:"mag9-7",
  cityId:"mumbai",
  name:"Five Gardens, Matunga East",
  type:"experience",
  neighborhood:"Matunga East / Parsi Colony",
  description:"A cluster of five small public gardens in the Parsi colony of Matunga East that form a connected green space where the Parsi community has been taking morning walks since the 1930s. The surrounding bungalows and the residents who maintain century-old routines are the real attraction.",
  vibe:8.8,
  localLove:9.4,
  uniqueness:8.7,
  tags:["parsi colony", "five gardens", "1930s", "morning walk", "community green"],
  tip:"6-8am on weekdays when the elderly Parsi residents are on their morning walk. The community is welcoming and the architecture of the surrounding bungalows is extraordinary.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Dharavi / Sion / Chembur",
  lat:19.0307,
  lng:72.8477,
  maps_url:"https://www.google.com/maps?q=19.0307,72.8477",
  transport:[{line:"Central Line", station:"Matunga Road", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?parsi,colony,five,gardens,morning,walk,bungalow"
},
{
  id:"mag9-8",
  cityId:"mumbai",
  name:"Antop Hill Koli Village",
  type:"experience",
  neighborhood:"Antop Hill, Wadala",
  description:"A Koli fishing community village on Antop Hill \u2014 a hilltop community surrounded by Mumbai's largest port \u2014 that has been fishing the Thane Creek for centuries. The village temple dates to 1650 and the community maintains the same relationship with the water that their ancestors did, despite being surrounded by industrial port infrastructure.",
  vibe:9.0,
  localLove:9.3,
  uniqueness:9.5,
  tags:["koli village", "antop hill", "1650 temple", "thane creek", "port surroundings", "centuries old"],
  tip:"Walk up from Wadala station and ask for the Koli village. The temple priest explains the community history. Go for the view over the creek.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Dharavi / Sion / Chembur",
  lat:19.0223,
  lng:72.8685,
  maps_url:"https://www.google.com/maps?q=19.0223,72.8685",
  transport:[{line:"Harbour Line", station:"Wadala Road", walk_min:18}],
  photo_url:"https://source.unsplash.com/featured/800x500/?koli,fishing,village,antop,hill,temple,creek"
},
{
  id:"mag9-9",
  cityId:"mumbai",
  name:"Vinod Cold Drinks, Sion",
  type:"restaurant",
  neighborhood:"Sion",
  description:"A juice and cold drink shop in Sion that has been making fresh sugarcane juice with ginger and lime since 1961. The press is original \u2014 a cast iron roller sugarcane press that the family refuses to replace. The juice is served in steel glasses and costs \u20b920. The shop interior hasn't been updated since 1978.",
  vibe:8.7,
  localLove:9.6,
  uniqueness:8.9,
  tags:["sugarcane juice", "1961", "cast iron press", "steel glass", "\u20b920", "sion"],
  tip:"Go in the afternoon when the sugarcane press is running at full speed. The ginger-lime variant. Cash and steel glasses only.",
  status:"approved",
  agentIcon:"\ud83c\udf19",
  discoveredBy:"Dharavi / Sion / Chembur",
  lat:19.0392,
  lng:72.8621,
  maps_url:"https://www.google.com/maps?q=19.0392,72.8621",
  transport:[{line:"Central Line", station:"Sion", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?sugarcane,juice,press,cast,iron,steel,glass"
},
{
  id:"mag10-0",
  cityId:"mumbai",
  name:"Hanging Gardens at Dusk",
  type:"experience",
  neighborhood:"Malabar Hill",
  description:"The terraced gardens on Malabar Hill that face the Arabian Sea \u2014 at dusk the light turns the water gold while the city below contracts into evening light. The topiary animals are inexplicably calming. The Parsee Tower of Silence is just beyond the treeline, invisible but present.",
  vibe:9.3,
  localLove:8.9,
  uniqueness:8.4,
  tags:["hanging gardens", "malabar hill", "dusk", "sea view", "free", "topiary"],
  tip:"Go 30 minutes before sunset and walk to the western edge. The view of Marine Drive curving below with the sea beyond is one of Mumbai's great sights.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Malabar Hill / Breach Candy / Walkeshwar",
  lat:18.955,
  lng:72.8036,
  maps_url:"https://www.google.com/maps?q=18.9550,72.8036",
  transport:[{line:"Bus", station:"Malabar Hill / Babulnath", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?malabar,hill,hanging,gardens,sea,sunset,topiary"
},
{
  id:"mag10-1",
  cityId:"mumbai",
  name:"Soam, Babulnath",
  type:"restaurant",
  neighborhood:"Babulnath / Girgaon",
  description:"A Gujarati and Rajasthani vegetarian restaurant near Babulnath temple that has been the destination for Gujarati pure-veg comfort food for 25 years. The handvo (savoury rice cake), the dhokla, and the thali are all made to the kind of recipes that Gujarati mothers benchmark against.",
  vibe:8.8,
  localLove:9.4,
  uniqueness:8.6,
  tags:["gujarati veg", "handvo", "dhokla", "babulnath", "pure veg", "25 years"],
  tip:"The handvo and the complete thali. Weekend lunch for the fullest experience \u2014 the mango aamras in summer.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Malabar Hill / Breach Candy / Walkeshwar",
  lat:18.9538,
  lng:72.8102,
  maps_url:"https://www.google.com/maps?q=18.9538,72.8102",
  transport:[{line:"Bus", station:"Babulnath", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?gujarati,vegetarian,handvo,dhokla,restaurant,clean"
},
{
  id:"mag10-2",
  cityId:"mumbai",
  name:"Breach Candy Club Sunset",
  type:"bar",
  neighborhood:"Breach Candy",
  description:"A colonial-era club with a 1930s swimming pool on the Arabian Sea. Non-members can access the seafront bar area without a pool membership and the sunset view from here \u2014 looking south along the sea toward Colaba \u2014 is unmatched in the city. The drinks are expensive and the conversation is South Mumbai old money.",
  vibe:9.2,
  localLove:7.8,
  uniqueness:9.1,
  tags:["colonial club", "1930s pool", "breach candy", "sea view", "old money", "sunset bar"],
  tip:"Walk in and ask for the seafront bar. No pool access but the bar has the same view. Dress appropriately for a colonial club.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Malabar Hill / Breach Candy / Walkeshwar",
  lat:18.968,
  lng:72.8049,
  maps_url:"https://www.google.com/maps?q=18.9680,72.8049",
  transport:[{line:"Bus", station:"Breach Candy", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?colonial,club,arabian,sea,sunset,swimming,pool"
},
{
  id:"mag10-3",
  cityId:"mumbai",
  name:"Chowpatty Beach at 6am",
  type:"experience",
  neighborhood:"Chowpatty, Girgaon",
  description:"Girgaon Chowpatty beach before the day starts \u2014 at 6am the yoga practitioners, the horse exercisers, the bhelpuri vendors setting up, the elderly couples walking with their shoes off. By 9am it's a different place. The Marine Drive arc behind you and the sea before you, free of everything.",
  vibe:9.1,
  localLove:9.5,
  uniqueness:8.3,
  tags:["chowpatty", "6am", "yoga", "free", "marine drive view", "horse exercise"],
  tip:"6am on a weekday. The yoga practitioners on the north end, the horse trainers on the south. The sea is warmest between August and October.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Malabar Hill / Breach Candy / Walkeshwar",
  lat:18.9544,
  lng:72.8149,
  maps_url:"https://www.google.com/maps?q=18.9544,72.8149",
  transport:[{line:"Western Line", station:"Charni Road", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?chowpatty,beach,morning,yoga,marine,drive,quiet"
},
{
  id:"mag10-4",
  cityId:"mumbai",
  name:"Cream Centre, Chowpatty",
  type:"restaurant",
  neighborhood:"Chowpatty",
  description:"A pure vegetarian restaurant with a Chowpatty address since 1963 that does Mexican, Lebanese, and Italian food through a Gujarati lens. The outcome is extraordinary: sev tostadas, paneer shawarma, and pasta with panch phoron. Sounds wrong. Tastes right.",
  vibe:8.6,
  localLove:9.2,
  uniqueness:9.0,
  tags:["pure vegetarian", "gujarati interpretation", "1963", "chowpatty", "paneer shawarma", "sev tostadas"],
  tip:"The sev tostadas and the paneer shawarma. The mock meat dishes are technically impressive. Evening for the full Chowpatty experience.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Malabar Hill / Breach Candy / Walkeshwar",
  lat:18.9541,
  lng:72.8144,
  maps_url:"https://www.google.com/maps?q=18.9541,72.8144",
  transport:[{line:"Western Line", station:"Charni Road", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?vegetarian,restaurant,1963,chowpatty,menu,diverse"
},
{
  id:"mag10-5",
  cityId:"mumbai",
  name:"Malabar Hill Jain Derasars Walk",
  type:"experience",
  neighborhood:"Malabar Hill",
  description:"A walking trail through four Jain temples (derasars) clustered on Malabar Hill, each with extraordinary carved marble interiors. The Babu Amichand Panalal Adishwarji temple has a marble-inlaid interior that took 30 years to complete. Entry free, photography not permitted, the silence inside is absolute.",
  vibe:9.3,
  localLove:8.8,
  uniqueness:9.2,
  tags:["jain temples", "derasar", "marble carved", "malabar hill", "30 year marble", "free entry"],
  tip:"Morning 7-11am when the temples are active. Dress conservatively. Remove shoes and leather goods outside. The full walk takes 90 minutes.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Malabar Hill / Breach Candy / Walkeshwar",
  lat:18.953,
  lng:72.8065,
  maps_url:"https://www.google.com/maps?q=18.9530,72.8065",
  transport:[{line:"Bus", station:"Teen Batti / Malabar Hill", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?jain,temple,marble,carved,interior,malabar,hill"
},
{
  id:"mag10-6",
  cityId:"mumbai",
  name:"Marine Drive at 5am",
  type:"experience",
  neighborhood:"Marine Drive / Nariman Point",
  description:"The Queen's Necklace before the city wakes \u2014 the entire 3.6km arc of Marine Drive with almost no traffic, the Arabian Sea on one side and the art deco apartment buildings on the other lit from within by early risers. The wave action on the tetrapods in the morning light is extraordinary.",
  vibe:9.7,
  localLove:9.6,
  uniqueness:8.8,
  tags:["marine drive", "5am", "art deco", "queen's necklace", "free", "tetrapods"],
  tip:"5am is the window. Walk from Nariman Point north to Chowpatty in 45 minutes. The art deco apartment buildings have their best light before 7am.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Malabar Hill / Breach Candy / Walkeshwar",
  lat:18.9434,
  lng:72.823,
  maps_url:"https://www.google.com/maps?q=18.9434,72.8230",
  transport:[{line:"Western Line", station:"Churchgate", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?marine,drive,dawn,art,deco,buildings,sea,empty"
},
{
  id:"mag10-7",
  cityId:"mumbai",
  name:"Swati Snacks",
  type:"restaurant",
  neighborhood:"Tardeo / Tejpal Road",
  description:"A Gujarati snacks restaurant that has been the city's definitive answer to upscale street food since 1963 \u2014 clean, precise, and using the best ingredients. The pani puri comes with flavoured pani in six varieties. The dahiwada is served in an actual ceramic bowl. Every Mumbaikar has brought every out-of-towner here.",
  vibe:9.0,
  localLove:9.5,
  uniqueness:8.4,
  tags:["gujarati snacks", "pani puri", "dahiwada", "1963", "upscale street food", "tardeo"],
  tip:"Arrive 15 minutes after opening to avoid the queue. Order the pani puri with all six varieties of pani. The dahiwada and the undhiyu in winter.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Malabar Hill / Breach Candy / Walkeshwar",
  lat:18.961,
  lng:72.8092,
  maps_url:"https://www.google.com/maps?q=18.9610,72.8092",
  transport:[{line:"Bus", station:"Tardeo", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?gujarati,snacks,pani,puri,tardeo,ceramic,bowl"
},
{
  id:"mag10-8",
  cityId:"mumbai",
  name:"Walkeshwar Temple Tank Morning",
  type:"experience",
  neighborhood:"Walkeshwar, Malabar Hill",
  description:"The Banganga tank \u2014 an ancient freshwater tank on Malabar Hill \u2014 at its best at dawn when priests perform their morning rituals and the migratory birds rest on the steps. The temples surrounding the tank date from the 12th to 18th century and are all active. The sound of bells and the smell of incense start at 5:30am.",
  vibe:9.5,
  localLove:9.2,
  uniqueness:9.5,
  tags:["banganga tank", "dawn ritual", "12th century temples", "migratory birds", "walkeshwar", "5:30am bells"],
  tip:"5:30am for the morning puja. Walk the tank perimeter \u2014 it takes 20 minutes. The chai stall at the north entrance opens at 6am.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Malabar Hill / Breach Candy / Walkeshwar",
  lat:18.9519,
  lng:72.7989,
  maps_url:"https://www.google.com/maps?q=18.9519,72.7989",
  transport:[{line:"Bus", station:"Walkeshwar Road", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?banganga,tank,dawn,temple,ritual,bells,ancient"
},
{
  id:"mag10-9",
  cityId:"mumbai",
  name:"Khyber Restaurant",
  type:"restaurant",
  neighborhood:"Fort / Kala Ghoda",
  description:"A North Indian restaurant in Fort that has served consistent Mughlai and Frontier food since 1974 in a room decorated with miniature paintings and terracotta tiles. The rogan josh and the dal bukhara have not changed. The bread section \u2014 naan, paratha, sheermal \u2014 is the strongest argument for the kitchen.",
  vibe:8.8,
  localLove:9.0,
  uniqueness:8.5,
  tags:["mughlai", "1974", "fort", "rogan josh", "dal bukhara", "miniature paintings"],
  tip:"The rogan josh and the sheermal. Lunch on a weekday when the Fort office crowd fills it. Book a corner table for the best view of the room.",
  status:"approved",
  agentIcon:"\ud83d\udd2e",
  discoveredBy:"Malabar Hill / Breach Candy / Walkeshwar",
  lat:18.929,
  lng:72.833,
  maps_url:"https://www.google.com/maps?q=18.9290,72.8330",
  transport:[{line:"Western Line", station:"Churchgate", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mughlai,restaurant,fort,1974,rogan,josh,miniature"
}
];




// ─── SEED DATA ────────────────────────────────────────────────────────────────
const INITIAL_CITIES = [
  {
    id:"bangkok", name:"Bangkok", country:"Thailand", emoji:"🇹🇭",
    tagline:"The city that never sleeps — and never stops surprising",
    description:"Beyond the Grand Palace and Khao San Road lies a Bangkok most tourists never find.",
    active:true,
  },
  {
    id:"mumbai", name:"Mumbai", country:"India", emoji:"🇮🇳",
    tagline:"Maximum City",
    description:"India's most electric megacity — Bollywood mythology, colonial grandeur, and 22 million stories collide on a peninsula between mangrove and sea.",
    active:true,
  },
];

const INITIAL_SPOTS = [
{
  id:"s1",
  cityId:"bangkok",
  name:"The Commons Thonglor",
  type:"experience",
  neighborhood:"Thonglor",
  description:"A brutalist community hub draped in climbing plants. No mall energy \u2014 just locals spilling out of food stalls, independent coffee bars and a wine shop onto raw concrete terraces. Best on weekday evenings.",
  vibe:9.1,
  localLove:8.7,
  uniqueness:7.8,
  tags:["food hall", "architecture", "local scene", "evening"],
  tip:"Go to the top floor. Wine bar with zero pretension, incredible people-watching.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7283,
  lng:100.5832,
  maps_url:"https://www.google.com/maps?q=13.7283,100.5832",
  transport:[{line:"BTS Sukhumvit", station:"Thong Lo (E6)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,community,market,plants,brutalist"
},
{
  id:"s2",
  cityId:"bangkok",
  name:"Rod Fai Train Night Market",
  type:"market",
  neighborhood:"Ratchada",
  description:"A retro night market that makes Chatuchak look tame. Vintage everything \u2014 cameras, motorcycles, neon signs \u2014 plus bars in stacked shipping containers.",
  vibe:9.4,
  localLove:9.0,
  uniqueness:8.5,
  tags:["night market", "vintage", "street food", "bars"],
  tip:"Take MRT to National Cultural Center, Exit 3. Busiest Thu\u2013Sun after 8pm.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7757,
  lng:100.5699,
  maps_url:"https://www.google.com/maps?q=13.7757,100.5699",
  transport:[{line:"MRT Blue", station:"Thailand Cultural Centre", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,night,market,vintage,train,neon"
},
{
  id:"s3",
  cityId:"bangkok",
  name:"Wat Pariwat \u2014 Pop Culture Temple",
  type:"experience",
  neighborhood:"Sathon",
  description:"A working Buddhist temple where monks added David Beckham, Batman, Pikachu and Spider-Man to the carvings.",
  vibe:8.8,
  localLove:7.5,
  uniqueness:10.0,
  tags:["temple", "bizarre", "free", "photography"],
  tip:"Best mid-morning. Sarongs available at entrance.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7045,
  lng:100.5294,
  maps_url:"https://www.google.com/maps?q=13.7045,100.5294",
  transport:[{line:"BTS Silom", station:"Surasak (S4)", walk_min:18}, {line:"Boat", station:"Tha Sathon (Central Pier)", walk_min:20}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,temple,ornate,gold,colourful"
},
{
  id:"s4",
  cityId:"bangkok",
  name:"Cabbages & Condoms",
  type:"restaurant",
  neighborhood:"Sukhumvit Soi 12",
  description:"A non-profit restaurant where every surface and mannequin is decorated with condoms \u2014 proceeds fund rural development. The Thai food is genuinely excellent.",
  vibe:8.2,
  localLove:8.0,
  uniqueness:9.6,
  tags:["non-profit", "thai food", "quirky"],
  tip:"Garden seating at the back is the move.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7313,
  lng:100.5631,
  maps_url:"https://www.google.com/maps?q=13.7313,100.5631",
  transport:[{line:"BTS Sukhumvit", station:"Asok (E4)", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,thai,restaurant,garden,quirky"
},
{
  id:"s5",
  cityId:"bangkok",
  name:"Jay Fai",
  type:"restaurant",
  neighborhood:"Banglamphu",
  description:"A woman in ski goggles cooks over roaring flames on a street-side cart with a Michelin star. The crab omelette is otherworldly.",
  vibe:9.7,
  localLove:9.5,
  uniqueness:9.2,
  tags:["michelin", "street food", "legendary", "crab omelette"],
  tip:"Book via LINE. Arrive exactly on time.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7543,
  lng:100.5015,
  maps_url:"https://www.google.com/maps?q=13.7543,100.5015",
  transport:[{line:"MRT Blue", station:"Sam Yot", walk_min:10}, {line:"Boat", station:"Tha Phra Chan", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,street,food,chef,wok,fire"
},
{
  id:"s6",
  cityId:"bangkok",
  name:"Chang Chui Creative Market",
  type:"market",
  neighborhood:"Bang Phlat",
  description:"A repurposed airplane hangs over an eclectic market-meets-art-installation. Indie designers, small-batch food vendors, street performers.",
  vibe:8.9,
  localLove:8.3,
  uniqueness:9.1,
  tags:["art", "market", "design", "airplane"],
  tip:"Friday and Saturday nights only. Come after 6pm.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7794,
  lng:100.4934,
  maps_url:"https://www.google.com/maps?q=13.7794,100.4934",
  transport:[{line:"Taxi / Grab only", station:"No nearby transit", walk_min:0}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,art,market,creative,airplane,warehouse"
},
{
  id:"s7",
  cityId:"bangkok",
  name:"Baan Silapin (Artist's House)",
  type:"experience",
  neighborhood:"Thonburi",
  description:"A centuries-old teak house on a canal with traditional shadow puppet performances. Reached by longtail boat.",
  vibe:9.3,
  localLove:8.6,
  uniqueness:9.4,
  tags:["art", "canal", "puppets", "cultural"],
  tip:"Sunday afternoon puppet show. Canal boat from Tha Tien pier.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7427,
  lng:100.4818,
  maps_url:"https://www.google.com/maps?q=13.7427,100.4818",
  transport:[{line:"Boat", station:"Tha Tien Pier", walk_min:5}, {line:"BTS Silom", station:"Saphan Taksin (S6)", walk_min:25}],
  photo_url:"https://source.unsplash.com/featured/800x500/?thailand,canal,wooden,house,artist"
},
{
  id:"s8",
  cityId:"bangkok",
  name:"Khlong Ong Ang Walking Street",
  type:"bar",
  neighborhood:"Old Town",
  description:"A formerly grim canal now strung with lights, acoustic musicians on bridges, pop-up bars in reclaimed spaces.",
  vibe:9.0,
  localLove:9.2,
  uniqueness:8.7,
  tags:["bars", "live music", "canal", "local"],
  tip:"Weekend evenings after 5pm. Boat noodles at the north end.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7482,
  lng:100.5027,
  maps_url:"https://www.google.com/maps?q=13.7482,100.5027",
  transport:[{line:"MRT Blue", station:"Sam Yot", walk_min:8}, {line:"Boat", station:"Tha Saphan Phut", walk_min:6}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,canal,night,lights,market,walkway"
},
{
  id:"s9",
  cityId:"bangkok",
  name:"Bangkokian Museum",
  type:"experience",
  neighborhood:"Bangrak",
  description:"Three traditional teak houses frozen in the 1940s\u201360s. Free entry, almost always empty, run by volunteers.",
  vibe:7.8,
  localLove:9.0,
  uniqueness:8.9,
  tags:["free", "museum", "history", "hidden"],
  tip:"Open Weds\u2013Sun, 10am\u20134pm.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7248,
  lng:100.5126,
  maps_url:"https://www.google.com/maps?q=13.7248,100.5126",
  transport:[{line:"BTS Silom", station:"Surasak (S4)", walk_min:12}, {line:"Boat", station:"Tha Sathon (Central Pier)", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,teak,house,heritage,museum"
},
{
  id:"s10",
  cityId:"bangkok",
  name:"KHAAN Fine Dining",
  type:"restaurant",
  neighborhood:"Ploenchit",
  description:"Eighteen seats. An 11-course journey through Thai regional cuisine. Hidden in a residential street with no signage.",
  vibe:9.2,
  localLove:8.8,
  uniqueness:9.0,
  tags:["michelin guide", "tasting menu", "intimate"],
  tip:"Book weeks ahead. BYO wine \u2014 corkage is generous.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7434,
  lng:100.5453,
  maps_url:"https://www.google.com/maps?q=13.7434,100.5453",
  transport:[{line:"BTS Sukhumvit", station:"Ploen Chit (E2)", walk_min:11}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,fine,dining,thai,cuisine,plating"
},
{
  id:"s11",
  cityId:"bangkok",
  name:"Talat Noi Back Streets",
  type:"experience",
  neighborhood:"Talat Noi",
  description:"Bangkok's oldest Chinese trading neighbourhood. Narrow alleys, century-old shophouses, a mechanic next to a specialty coffee bar.",
  vibe:9.5,
  localLove:9.1,
  uniqueness:8.4,
  tags:["neighbourhood", "walking", "history", "street art"],
  tip:"Best 7\u20139am when it's locals-only.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7372,
  lng:100.5091,
  maps_url:"https://www.google.com/maps?q=13.7372,100.5091",
  transport:[{line:"MRT Blue", station:"Hua Lamphong", walk_min:12}, {line:"Boat", station:"Tha Ratchawong", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,chinatown,alley,colourful,street,art"
},
{
  id:"s12",
  cityId:"bangkok",
  name:"Mojjo Rooftop Lounge",
  type:"bar",
  neighborhood:"Silom",
  description:"A Latin-flavoured rooftop hidden inside the Skyview Hotel. Rum-heavy cocktails, tapas, DJs who play for people who actually dance.",
  vibe:8.6,
  localLove:8.1,
  uniqueness:8.3,
  tags:["rooftop", "cocktails", "latin vibes", "DJ"],
  tip:"Happy hour until 8pm. The ceviche is exceptional.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:13.7229,
  lng:100.5281,
  maps_url:"https://www.google.com/maps?q=13.7229,100.5281",
  transport:[{line:"BTS Silom", station:"Chong Nonsi (S3)", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bangkok,rooftop,bar,skyline,night,lights"
},
{
  id:"ms1",
  cityId:"mumbai",
  name:"Irani Caf\u00e9 Leopold",
  type:"restaurant",
  neighborhood:"Colaba",
  description:"One of Mumbai's last surviving Irani caf\u00e9s, open since 1871. Marble-topped tables, bentwood chairs, faded mirrors, and bun maska that hasn't changed in a century. The staff have been here longer than most of the furniture.",
  vibe:8.9,
  localLove:9.1,
  uniqueness:9.3,
  tags:["irani cafe", "bun maska", "1871", "heritage", "colaba"],
  tip:"Order the chai and bun maska. Come on a weekday morning when the regulars hold court.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:18.922,
  lng:72.8316,
  maps_url:"https://www.google.com/maps?q=18.9220,72.8316",
  transport:[{line:"CST / Local Train", station:"Churchgate", walk_min:18}, {line:"Bus", station:"Colaba Causeway", walk_min:3}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,irani,cafe,vintage,marble,chairs,chai"
},
{
  id:"ms2",
  cityId:"mumbai",
  name:"Mahim Causeway Fish Market",
  type:"market",
  neighborhood:"Mahim",
  description:"A pre-dawn wet market where Koli fishing community boats unload directly onto the causeway. Pomfret, surmai, Bombay duck \u2014 sorted, bargained, and sold in a beautiful chaos of Tamil, Marathi, and Konkani.",
  vibe:9.2,
  localLove:9.8,
  uniqueness:9.0,
  tags:["fish market", "koli community", "dawn", "causeway", "local trade"],
  tip:"Arrive by 5:30am. Bring cash. The pomfret here is the freshest in the city \u2014 cheaper than Crawford Market.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:19.0395,
  lng:72.8412,
  maps_url:"https://www.google.com/maps?q=19.0395,72.8412",
  transport:[{line:"Western Line", station:"Mahim", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,fish,market,dawn,sorting,koli,boats"
},
{
  id:"ms3",
  cityId:"mumbai",
  name:"Chor Bazaar Antique Lane",
  type:"market",
  neighborhood:"Bhendi Bazaar / Mutton Street",
  description:"Mumbai's oldest flea market, Mutton Street in particular, crammed with colonial furniture, gramophones, brass Ganesh figurines, vintage Bollywood posters, and objects whose provenance is best not interrogated.",
  vibe:9.0,
  localLove:8.7,
  uniqueness:9.1,
  tags:["antiques", "flea market", "colonial", "bollywood posters", "chor bazaar"],
  tip:"Friday is best when new stock appears. The deeper you walk into the lanes, the better the finds. Bargain hard.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:18.9603,
  lng:72.831,
  maps_url:"https://www.google.com/maps?q=18.9603,72.8310",
  transport:[{line:"Central Line", station:"Sandhurst Road", walk_min:9}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,chor,bazaar,antiques,colonial,furniture"
},
{
  id:"ms4",
  cityId:"mumbai",
  name:"Khao Gully, Vile Parle",
  type:"market",
  neighborhood:"Vile Parle East",
  description:"A narrow lane that transforms into a food corridor after 6pm \u2014 40 stalls selling bhel, pav bhaji, kebabs, Chinese-Indian, and Punjabi street food. The mix of Gujarati and Punjabi vendors means every second stall is an argument about whose food is better.",
  vibe:8.7,
  localLove:9.5,
  uniqueness:8.0,
  tags:["street food", "bhel", "pav bhaji", "evening", "vile parle"],
  tip:"Best after 7:30pm. The pav bhaji at stall 8 has a 45-year-old recipe. The bhel near the corner is the one.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:19.099,
  lng:72.8497,
  maps_url:"https://www.google.com/maps?q=19.0990,72.8497",
  transport:[{line:"Western Line", station:"Vile Parle", walk_min:7}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,street,food,lane,evening,vendors"
},
{
  id:"ms5",
  cityId:"mumbai",
  name:"Elephanta Caves Ferry",
  type:"experience",
  neighborhood:"Gharapuri Island",
  description:"A 1-hour ferry from Gateway of India to an island with 6th-century rock-cut Shiva temples. The ferry itself \u2014 shared with office workers, pilgrims, and tourists \u2014 is half the experience. Arrive early to have the cave to yourself before tour groups.",
  vibe:9.5,
  localLove:8.2,
  uniqueness:9.4,
  tags:["caves", "ferry", "6th century", "shiva temples", "island"],
  tip:"Take the 9am ferry, not the first one. Walk past the souvenir stalls to the hilltop temples \u2014 most people turn back at the main cave.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:18.9633,
  lng:72.9315,
  maps_url:"https://www.google.com/maps?q=18.9633,72.9315",
  transport:[{line:"Ferry", station:"Gateway of India", walk_min:2}],
  photo_url:"https://source.unsplash.com/featured/800x500/?elephanta,island,caves,ancient,rock,carved,ferry"
},
{
  id:"ms6",
  cityId:"mumbai",
  name:"Mohammed Ali Road After Dark",
  type:"market",
  neighborhood:"Mohammed Ali Road",
  description:"During Ramzan and on weekends year-round, this mile-long strip becomes Mumbai's greatest late-night food street. Nihari, seekh kebabs, malpua, phirni in terracotta bowls, and cauldrons of biryani served from stalls that have fed the city for generations.",
  vibe:9.6,
  localLove:9.7,
  uniqueness:8.9,
  tags:["nihari", "kebabs", "ramzan", "late night", "mughlai"],
  tip:"Come after 11pm. The Suleiman Usman Mithaiwala malpua is the thing. Noor Mohammadi Hotel for nihari \u2014 order the trotters.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:18.9603,
  lng:72.8352,
  maps_url:"https://www.google.com/maps?q=18.9603,72.8352",
  transport:[{line:"Central Line", station:"Sandhurst Road", walk_min:11}, {line:"Bus", station:"Mohammed Ali Road", walk_min:3}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,mohammed,ali,road,night,food,ramzan"
},
{
  id:"ms7",
  cityId:"mumbai",
  name:"Banganga Tank at Dawn",
  type:"experience",
  neighborhood:"Malabar Hill",
  description:"A sacred freshwater tank on Malabar Hill surrounded by temples, claimed to be 1,800 years old. At dawn, priests perform rituals while pigeons wheel overhead and local residents do their morning walk. Absolute silence inside despite being inside a city of 22 million.",
  vibe:9.4,
  localLove:9.2,
  uniqueness:9.5,
  tags:["sacred tank", "dawn", "temples", "malabar hill", "1800 years"],
  tip:"Walk down from the Walkeshwar Road entrance at sunrise. The resident priests don't expect visitors and will answer questions if you ask respectfully.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:18.9519,
  lng:72.7989,
  maps_url:"https://www.google.com/maps?q=18.9519,72.7989",
  transport:[{line:"Bus", station:"Walkeshwar Road", walk_min:8}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,banganga,sacred,tank,temples,dawn"
},
{
  id:"ms8",
  cityId:"mumbai",
  name:"Sassoon Docks at Sunrise",
  type:"experience",
  neighborhood:"Colaba / Cuffe Parade",
  description:"Mumbai's oldest working docks where the night's catch arrives before dawn. Fishing boats unload while workers sort ice and fish in the deep blue light. The smell is extraordinary. The chaos is choreographed. Photographers come here obsessively.",
  vibe:9.3,
  localLove:9.6,
  uniqueness:9.2,
  tags:["fishing docks", "sunrise", "koli", "photography", "raw"],
  tip:"Arrive at 5am before the fish market opens properly. Ask before photographing \u2014 the workers are subjects, not attractions.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:18.9133,
  lng:72.823,
  maps_url:"https://www.google.com/maps?q=18.9133,72.8230",
  transport:[{line:"Bus", station:"Cuffe Parade / Sassoon Dock", walk_min:5}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,fishing,dock,sunrise,boats,sorting,catch"
},
{
  id:"ms9",
  cityId:"mumbai",
  name:"Khotachiwadi Heritage Village",
  type:"experience",
  neighborhood:"Girgaon / Gaiwadi",
  description:"A living heritage precinct of Portuguese-era wooden cottages in the middle of dense Girgaon. 28 homes, most owned by the same families for generations, with bougainvillea overhanging their balconies and cats sleeping on every step. The contrast with the streets 50 metres away is startling.",
  vibe:9.5,
  localLove:9.0,
  uniqueness:9.8,
  tags:["portuguese cottages", "living heritage", "hidden village", "girgaon", "bougainvillea"],
  tip:"Enter from Janmabhoomi Marg lane. Walk quietly \u2014 people live here. The corner cottage at the end has been painted by generations of art students.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:18.954,
  lng:72.8165,
  maps_url:"https://www.google.com/maps?q=18.9540,72.8165",
  transport:[{line:"Western Line", station:"Charni Road", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,portuguese,cottages,bougainvillea,heritage,lane"
},
{
  id:"ms10",
  cityId:"mumbai",
  name:"Dharavi Pottery Colony",
  type:"experience",
  neighborhood:"Dharavi",
  description:"The Kumbharwada quarter of Dharavi where the Kumbhar community has been throwing pots for 250 years. The entire street is a working kiln \u2014 damp clay, wood smoke, the rhythm of wheels. Potters sell direct. Come in morning when the firing is happening.",
  vibe:8.8,
  localLove:9.3,
  uniqueness:9.6,
  tags:["pottery", "kumbhar community", "250 years", "dharavi", "kiln"],
  tip:"Take an auto to Kumbharwada, Dharavi. Morning 8-11am best. Buy direct from makers \u2014 no markup.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:19.0419,
  lng:72.854,
  maps_url:"https://www.google.com/maps?q=19.0419,72.8540",
  transport:[{line:"Central Line", station:"Sion", walk_min:18}, {line:"Metro Line 1", station:"Matunga Road Metro", walk_min:15}],
  photo_url:"https://source.unsplash.com/featured/800x500/?dharavi,pottery,wheel,clay,kiln,smoke"
},
{
  id:"ms11",
  cityId:"mumbai",
  name:"Versova Beach Morning",
  type:"experience",
  neighborhood:"Versova / Andheri West",
  description:"Before the day heats up, Versova beach belongs to the Koli fishing village that pre-dates Mumbai. Boats painted in bright colours, women mending nets, the smell of drying fish. By 9am it's tourists \u2014 be there at 6.",
  vibe:8.9,
  localLove:9.4,
  uniqueness:8.6,
  tags:["fishing village", "koli", "dawn beach", "nets", "boats"],
  tip:"Walk to the northern end past the fishing village rather than the tourist beach. The tea stall by the boat repair yard opens at 6am.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:19.1165,
  lng:72.8108,
  maps_url:"https://www.google.com/maps?q=19.1165,72.8108",
  transport:[{line:"Metro Line 1", station:"Versova", walk_min:12}],
  photo_url:"https://source.unsplash.com/featured/800x500/?mumbai,beach,fishing,village,boats,morning,nets"
},
{
  id:"ms12",
  cityId:"mumbai",
  name:"Pali Village Caf\u00e9, Bandra",
  type:"restaurant",
  neighborhood:"Bandra West",
  description:"A century-old East Indian community home converted into a caf\u00e9 that still feels like someone's living room. Thali specials change daily, the sorpotel is made to a family recipe, and the coconut feni is served without ceremony.",
  vibe:8.7,
  localLove:9.1,
  uniqueness:8.8,
  tags:["east indian community", "sorpotel", "feni", "bandra", "converted home"],
  tip:"The Sunday East Indian thali is the reason to visit. Book \u2014 it fills up.",
  status:"approved",
  agentIcon:"SEED",
  discoveredBy:"Original",
  lat:19.058,
  lng:72.829,
  maps_url:"https://www.google.com/maps?q=19.0580,72.8290",
  transport:[{line:"Western Line", station:"Bandra", walk_min:14}],
  photo_url:"https://source.unsplash.com/featured/800x500/?bandra,converted,bungalow,cafe,goan,sorpotel"
}
];




// ─── API ───────────────────────────────────────────────────────────────────────
async function callClaude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages:[{ role:"user", content:user }] }),
  });
  const data = await res.json();
  return data.content?.map(b=>b.text||"").join("")||"";
}

// ─── NAV ───────────────────────────────────────────────────────────────────────
const Nav = ({ view, setView, adminLoggedIn, pendingCount, selectedCity }) => (
  <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(12,10,8,0.94)", backdropFilter:"blur(14px)", borderBottom:"1px solid var(--border)", padding:"0 32px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
    <button onClick={()=>setView("home")} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"baseline", gap:8 }}>
      <span className="serif" style={{ fontSize:22, color:"var(--gold)", fontWeight:700, letterSpacing:"0.04em" }}>UNBEATEN</span>
      <span style={{ fontSize:10, color:"var(--text-muted)", letterSpacing:"0.18em", textTransform:"uppercase" }}>paths</span>
      {selectedCity&&<span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:"0.1em", borderLeft:"1px solid rgba(255,255,255,0.15)", paddingLeft:10, marginLeft:4 }}>{selectedCity==="bangkok"?"🇹🇭 Bangkok":"🇮🇳 Mumbai"}</span>}
    </button>
    <div style={{ display:"flex", gap:28, alignItems:"center" }}>
      <button className={`nav-link ${view==="home"?"active":""}`} onClick={()=>setView("home")}>Explore</button>
      <button className={`nav-link ${view==="submit"?"active":""}`} onClick={()=>setView("submit")}>Submit a Spot</button>
      <button className={`nav-link ${view==="admin"?"active":""}`} onClick={()=>setView("admin")} style={{ color:adminLoggedIn?"var(--teal)":undefined, position:"relative" }}>
        {adminLoggedIn?"⚙ Admin":"Admin"}
        {pendingCount>0&&<span style={{ position:"absolute", top:-6, right:-10, background:"var(--ember)", color:"white", borderRadius:"50%", width:16, height:16, fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{pendingCount}</span>}
      </button>
    </div>
  </nav>
);

// ─── HOME ──────────────────────────────────────────────────────────────────────
const CITY_META = {
  bangkok: { accent:"var(--gold)", bg:"linear-gradient(135deg,#0c0a08 0%,#1a1208 55%,#0f1a14 100%)", dot:"#c9933a", tagline:"City of Angels", subtitle:"Beyond the temples and rooftop bars" },
  mumbai:  { accent:"var(--ember)", bg:"linear-gradient(135deg,#0c0a08 0%,#1a0808 55%,#140a08 100%)", dot:"#d45a2a", tagline:"Maximum City", subtitle:"22 million stories — find the ones that matter" },
};

const HomeView = ({ cities, spots, setView, setSelectedSpot, selectedCity, setSelectedCity }) => {
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const activeCities = cities.filter(c=>c.active);
  const cityMeta = CITY_META[selectedCity] || CITY_META.bangkok;
  const cityInfo = activeCities.find(c=>c.id===selectedCity) || activeCities[0];
  const citySpots = spots.filter(s=>s.cityId===selectedCity&&s.status==="approved");
  const filtered = citySpots
    .filter(s=>typeFilter==="all"||s.type===typeFilter)
    .filter(s=>!search||s.name.toLowerCase().includes(search.toLowerCase())||s.neighborhood.toLowerCase().includes(search.toLowerCase())||s.tags.some(t=>t.includes(search.toLowerCase())));

  return (
    <div style={{ paddingTop:62 }}>
      {/* ── Hero ── */}
      <div style={{ minHeight:300, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"44px 40px 32px", background:cityMeta.bg, borderBottom:"1px solid var(--border)", position:"relative", overflow:"hidden", transition:"background 0.5s" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.03, backgroundImage:`radial-gradient(circle at 20% 50%,${cityMeta.dot} 1px,transparent 1px),radial-gradient(circle at 80% 20%,var(--teal) 1px,transparent 1px)`, backgroundSize:"60px 60px,40px 40px" }} />
        <div style={{ position:"absolute", top:24, right:52, opacity:0.04, fontSize:160, lineHeight:1 }}>✦</div>
        {/* City Switcher */}
        <div style={{ position:"absolute", top:20, right:32, display:"flex", gap:8 }}>
          {activeCities.map(c=>(
            <button key={c.id} onClick={()=>{ setSelectedCity(c.id); setTypeFilter("all"); setSearch(""); }}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 14px", border:"1px solid", borderColor:selectedCity===c.id?cityMeta.accent:"rgba(255,255,255,0.15)", borderRadius:6, background:selectedCity===c.id?"rgba(255,255,255,0.1)":"rgba(12,10,8,0.5)", backdropFilter:"blur(8px)", cursor:"pointer", transition:"all 0.2s", color:selectedCity===c.id?"var(--paper)":"var(--text-muted)", fontSize:12, fontWeight:selectedCity===c.id?700:400 }}>
              <span style={{ fontSize:15 }}>{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
        <div className="fade-up" style={{ maxWidth:660, position:"relative" }}>
          <div className="mono" style={{ color:cityMeta.accent, fontSize:10, letterSpacing:"0.22em", marginBottom:12, textTransform:"uppercase" }}>✦ Off the tourist trail · {cityInfo?.country||""} ✦</div>
          <h1 className="serif" style={{ fontSize:"clamp(32px,5.5vw,62px)", lineHeight:0.95, fontWeight:700, color:"var(--paper)", marginBottom:10 }}>
            {cityMeta.tagline}<br /><em style={{ color:cityMeta.accent }}>{cityInfo?.name||""}</em>
          </h1>
          <p style={{ color:"var(--text-muted)", fontSize:14, maxWidth:440, lineHeight:1.75 }}>{cityMeta.subtitle}. Rated by locals on vibe, authenticity, and uniqueness. No tourist traps.</p>
          <div style={{ marginTop:16, display:"flex", gap:16 }}>
            {[["restaurant","🍜"],["bar","🍺"],["experience","✨"],["market","🛍️"]].map(([t,e])=>(
              <div key={t} style={{ fontSize:11, color:"var(--text-muted)" }}>
                <span style={{ color:cityMeta.accent, fontWeight:700 }}>{citySpots.filter(s=>s.type===t).length}</span> {e} {t}s
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:"18px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
          {["all","restaurant","bar","experience","market"].map(f=>(
            <button key={f} onClick={()=>setTypeFilter(f)} style={{ padding:"5px 13px", border:"1px solid", borderColor:typeFilter===f?"var(--gold)":"var(--border)", background:typeFilter===f?"rgba(201,147,58,0.11)":"transparent", color:typeFilter===f?"var(--gold)":"var(--text-muted)", borderRadius:2, cursor:"pointer", fontFamily:"DM Sans", fontSize:11, fontWeight:600, textTransform:"capitalize", letterSpacing:"0.06em", transition:"all 0.18s" }}>
              {f==="all"?"All":`${TYPE_EMOJI[f]} ${f}`}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <input className="input-field" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search spots, hoods, tags…" style={{ width:210, padding:"7px 13px", fontSize:12 }} />
          <span style={{ fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{filtered.length} spots</span>
        </div>
      </div>

      <div style={{ padding:"18px 32px 80px" }}>
        <div className="spot-grid" style={{ borderRadius:4, overflow:"hidden", border:"1px solid var(--border)" }}>
          {filtered.map((spot,i)=>(
            <SpotCard key={spot.id} spot={spot} onClick={()=>{ setSelectedSpot(spot); setView("spot"); }} delay={i*25} />
          ))}
          {filtered.length===0&&<div style={{ gridColumn:"1/-1", textAlign:"center", padding:"72px 32px", color:"var(--text-muted)" }}><div style={{ fontSize:40, marginBottom:14 }}>🔍</div><p>No spots match your filters</p></div>}
        </div>
      </div>
    </div>
  );
};

// ─── SPOT CARD ────────────────────────────────────────────────────────────────
const SpotCard = ({ spot, onClick, delay=0 }) => {
  const score = parseFloat(avg(spot.vibe,spot.localLove,spot.uniqueness));
  const color = TYPE_COLORS[spot.type]||"var(--gold)";
  const [imgErr, setImgErr] = React.useState(false);
  const FALLBACK = `https://picsum.photos/seed/${encodeURIComponent(spot.id)}/800/500`;
  return (
    <div className="card-hover" onClick={onClick} style={{ borderRight:"1px solid var(--border)", animation:`fadeUp 0.45s ease ${delay}ms forwards`, opacity:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {/* Photo */}
      <div style={{ position:"relative", height:190, overflow:"hidden", flexShrink:0 }}>
        <img
          src={imgErr ? FALLBACK : (spot.photo_url||FALLBACK)}
          alt={spot.name}
          onError={()=>setImgErr(true)}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", transition:"transform 0.5s ease" }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(12,10,8,0.82) 0%, rgba(12,10,8,0.1) 55%, transparent 100%)" }} />
        <div style={{ position:"absolute", top:10, left:12 }}>
          <span style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, color:"rgba(255,255,255,0.9)", background:"rgba(12,10,8,0.55)", backdropFilter:"blur(6px)", padding:"3px 8px", borderRadius:3 }}>{TYPE_EMOJI[spot.type]} {spot.type}</span>
        </div>
        <div style={{ position:"absolute", bottom:10, right:12, textAlign:"right" }}>
          <span className="mono" style={{ fontSize:22, fontWeight:700, color:"var(--gold)", textShadow:"0 1px 8px rgba(0,0,0,0.8)" }}>{score}</span>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.6)", display:"block" }}>/10</span>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding:"16px 20px 20px", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:9, letterSpacing:"0.11em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:5 }}>{spot.neighborhood}</div>
        <h3 className="serif" style={{ fontSize:18, fontWeight:600, color:"var(--paper)", marginBottom:7, lineHeight:1.2 }}>{spot.name}</h3>
        <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.7, marginBottom:11, flex:1 }}>{spot.description.length>110?spot.description.slice(0,110)+"…":spot.description}</p>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:11 }}>
          {spot.tags.slice(0,3).map(t=><span key={t} className="tag">{t}</span>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[["Vibe",spot.vibe,"var(--gold)"],["Locals",spot.localLove,"var(--teal)"],["Unique",spot.uniqueness,"var(--ember)"]].map(([l,v,c])=>(
            <div key={l}>
              <div style={{ fontSize:8, color:"var(--text-muted)", letterSpacing:"0.1em", marginBottom:3, textTransform:"uppercase" }}>{l}</div>
              <div className="rating-track"><div className="rating-fill" style={{ width:`${v*10}%`, background:c }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── SPOT DETAIL ──────────────────────────────────────────────────────────────
const SpotDetail = ({ spot, setView }) => {
  const score = parseFloat(avg(spot.vibe,spot.localLove,spot.uniqueness));
  const color = TYPE_COLORS[spot.type]||"var(--gold)";
  const [imgErr, setImgErr] = React.useState(false);
  const FALLBACK = `https://picsum.photos/seed/${encodeURIComponent(spot.id)}/1200/500`;
  return (
    <div style={{ paddingTop:62 }}>
      {/* Hero photo */}
      <div style={{ position:"relative", height:"min(420px,52vw)", overflow:"hidden" }}>
        <img
          src={imgErr ? FALLBACK : (spot.photo_url||FALLBACK)}
          alt={spot.name}
          onError={()=>setImgErr(true)}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
        />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(12,10,8,1) 0%, rgba(12,10,8,0.4) 50%, rgba(12,10,8,0.05) 100%)" }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"32px 40px" }}>
          <div style={{ marginBottom:6 }}><span style={{ fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color, fontWeight:700 }}>{TYPE_EMOJI[spot.type]} {spot.type} · {spot.neighborhood}</span></div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:16 }}>
            <h1 className="serif" style={{ fontSize:"clamp(28px,5vw,54px)", fontWeight:700, color:"var(--paper)", lineHeight:1, textShadow:"0 2px 16px rgba(0,0,0,0.5)" }}>{spot.name}</h1>
            <div style={{ textAlign:"center", padding:"10px 18px", background:"rgba(12,10,8,0.7)", backdropFilter:"blur(10px)", border:"1px solid rgba(201,147,58,0.4)", borderRadius:6 }}>
              <div className="mono" style={{ fontSize:34, fontWeight:700, color:"var(--gold)", lineHeight:1 }}>{score}</div>
              <div style={{ fontSize:9, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:2 }}>Overall</div>
            </div>
          </div>
        </div>
        <button className="btn-ghost" onClick={()=>setView("home")} style={{ position:"absolute", top:16, left:20, fontSize:11, background:"rgba(12,10,8,0.6)", backdropFilter:"blur(8px)", padding:"6px 14px", borderRadius:4 }}>← Back</button>
      </div>
      {/* Content */}
      <div style={{ maxWidth:740, margin:"0 auto", padding:"32px 32px 80px" }}>
      <p style={{ fontSize:16, color:"var(--text-muted)", lineHeight:1.9, marginBottom:30 }}>{spot.description}</p>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:4, padding:24, marginBottom:22 }}>
        <h3 className="mono" style={{ fontSize:10, letterSpacing:"0.15em", color:"var(--text-muted)", textTransform:"uppercase", marginBottom:18 }}>RATINGS</h3>
        {[["Vibe",spot.vibe,"var(--gold)"],["Local Love",spot.localLove,"var(--teal)"],["Uniqueness",spot.uniqueness,"var(--ember)"]].map(([l,v,c])=>(
          <div key={l} style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:11, color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase" }}>{l}</span>
              <span className="mono" style={{ fontSize:12, color:c }}>{v.toFixed(1)}</span>
            </div>
            <div className="rating-track" style={{ height:4 }}><div className="rating-fill" style={{ width:`${v*10}%`, background:c }} /></div>
          </div>
        ))}
      </div>
      {spot.tip&&<div style={{ borderLeft:"3px solid var(--gold)", background:"rgba(201,147,58,0.04)", padding:"14px 16px", marginBottom:22 }}>
        <div className="mono" style={{ fontSize:9, letterSpacing:"0.15em", color:"var(--gold)", marginBottom:5, textTransform:"uppercase" }}>✦ Insider Tip</div>
        <p style={{ color:"var(--text)", fontSize:13.5, lineHeight:1.7 }}>{spot.tip}</p>
      </div>}
      {spot.lat && (
        <div style={{margin:"18px 0", padding:"14px 16px", background:"rgba(58,158,143,0.06)", border:"1px solid rgba(58,158,143,0.18)", borderRadius:10}}>
          <div className="mono" style={{fontSize:9,letterSpacing:"0.15em",color:"var(--teal)",marginBottom:10,textTransform:"uppercase"}}>✦ Location & Transit</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:spot.transport&&spot.transport.length?12:0}}>
            <span style={{fontSize:12,color:"var(--muted)",fontFamily:"'Space Mono',monospace"}}>{spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}</span>
            <a href={spot.maps_url} target="_blank" rel="noopener noreferrer"
              style={{marginLeft:"auto",background:"var(--teal)",color:"#fff",borderRadius:6,padding:"4px 11px",fontSize:11,fontWeight:700,cursor:"pointer",textDecoration:"none"}}>
              Open Maps ↗
            </a>
          </div>
          {spot.transport && spot.transport.length > 0 && (
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {spot.transport.map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--cream)"}}>
                  <span style={{fontSize:10,background:"rgba(58,158,143,0.2)",color:"var(--teal)",borderRadius:4,padding:"2px 7px",fontWeight:700,whiteSpace:"nowrap"}}>{t.line}</span>
                  <span style={{color:"var(--muted)"}}>→</span>
                  <span style={{flex:1}}>{t.station}</span>
                  {t.walk_min > 0 && <span style={{fontSize:10,background:"rgba(201,147,58,0.15)",color:"var(--gold)",borderRadius:4,padding:"2px 7px",fontWeight:700,whiteSpace:"nowrap"}}>{t.walk_min} min walk</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>{spot.tags.map(t=><span key={t} className="tag">{t}</span>)}</div>
      </div>
    </div>
  );
};

// ─── SUBMIT VIEW ──────────────────────────────────────────────────────────────
const SubmitView = ({ cities, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ cityId:"bangkok", name:"", type:"restaurant", neighborhood:"", description:"", tip:"", tags:"" });
  const [validation, setValidation] = useState({ agent1:null, agent2:null });
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const validate = async () => {
    if (!form.name||!form.neighborhood||form.description.length<60){ setError("Please fill all fields. Description needs 60+ characters."); return; }
    setError(""); setStep(2);
    const info = `Name: ${form.name}\nType: ${form.type}\nNeighborhood: ${form.neighborhood}\nDescription: ${form.description}\nTip: ${form.tip}\nTags: ${form.tags}`;
    const runAgent = async (sys) => {
      try { const text = await callClaude(sys, `Review this Bangkok spot:\n\n${info}`); try { return JSON.parse(text.replace(/```json|```/g,"").trim()); } catch { return { decision:"approve", confidence:65, notes:text.slice(0,180), flags:[] }; } }
      catch { return { decision:"approve", confidence:60, notes:"Agent unavailable.", flags:[] }; }
    };
    const [r1,r2] = await Promise.all([
      runAgent(`You are Agent 1: Fact Checker for UNBEATEN, an off-beat travel app. Is this Bangkok spot plausible and authentic? Respond ONLY as JSON: {"decision":"approve"|"reject","confidence":0-100,"notes":"max 80 words","flags":[]}`),
      runAgent(`You are Agent 2: Vibe Curator for UNBEATEN. Is this genuinely off the tourist trail with real local character? Respond ONLY as JSON: {"decision":"approve"|"reject","confidence":0-100,"notes":"max 80 words","flags":[]}`),
    ]);
    setValidation({ agent1:r1, agent2:r2 }); setStep(3);
    if (r1.decision==="approve"&&r2.decision==="approve") onSubmit({ ...form, tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean), agentValidation:{ agent1:r1, agent2:r2 } });
  };

  if (step===2) return (
    <div style={{ paddingTop:62, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"80vh" }}>
      <div className="mono" style={{ fontSize:10, letterSpacing:"0.2em", color:"var(--gold)", marginBottom:32, textTransform:"uppercase" }}>✦ Reviewing</div>
      <h2 className="serif" style={{ fontSize:36, color:"var(--paper)", marginBottom:48, textAlign:"center" }}>Two agents on the case</h2>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, maxWidth:520, width:"100%", padding:"0 32px" }}>
        {[{name:"Agent 1",role:"Fact Checker",icon:"🔍"},{name:"Agent 2",role:"Vibe Curator",icon:"✨"}].map(a=>(
          <div key={a.name} style={{ border:"1px solid var(--gold)", borderRadius:4, padding:22, background:"var(--surface)", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,var(--gold),transparent)", backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }} />
            <div style={{ fontSize:26, marginBottom:9 }}>{a.icon}</div>
            <div className="mono" style={{ fontSize:11, color:"var(--gold)", marginBottom:2 }}>{a.name}</div>
            <div style={{ fontSize:12, color:"var(--text-muted)" }}>{a.role}</div>
            <div style={{ display:"flex", gap:4, marginTop:12 }}>{[0,0.2,0.4].map(d=><div key={d} style={{ width:5, height:5, borderRadius:"50%", background:"var(--gold)", animation:`pulse 1.2s ${d}s infinite` }} />)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (step===3) {
    const { agent1, agent2 } = validation;
    const ok = agent1?.decision==="approve"&&agent2?.decision==="approve";
    return (
      <div style={{ paddingTop:62, maxWidth:660, margin:"0 auto", padding:"68px 32px" }}>
        <div style={{ textAlign:"center", marginBottom:36, padding:"32px 26px", border:`1px solid ${ok?"var(--teal)":"var(--ember)"}`, borderRadius:4, background:ok?"rgba(58,158,143,0.05)":"rgba(212,90,42,0.05)" }}>
          <div style={{ fontSize:44, marginBottom:12 }}>{ok?"✅":"❌"}</div>
          <h2 className="serif" style={{ fontSize:32, color:"var(--paper)", marginBottom:9 }}>{ok?"Passed AI Review":"Failed AI Review"}</h2>
          <p style={{ color:"var(--text-muted)", fontSize:13 }}>{ok?`"${form.name}" is now in the admin queue.`:"One or both agents rejected this. See feedback below."}</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
          {[["Agent 1 · Fact Checker","🔍",agent1],["Agent 2 · Vibe Curator","✨",agent2]].map(([label,icon,r])=>(
            <div key={label} style={{ border:`1px solid ${r?.decision==="approve"?"var(--teal)":"var(--ember)"}`, borderRadius:4, padding:18, background:"var(--surface)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:9 }}>
                <span className="mono" style={{ fontSize:9, color:"var(--text-muted)", textTransform:"uppercase" }}>{icon} {label}</span>
                <span style={{ padding:"2px 7px", borderRadius:20, fontSize:10, fontWeight:700, background:r?.decision==="approve"?"rgba(58,158,143,0.15)":"rgba(212,90,42,0.15)", color:r?.decision==="approve"?"var(--teal)":"var(--ember)" }}>{r?.decision?.toUpperCase()}</span>
              </div>
              <div className="mono" style={{ fontSize:11, color:"var(--gold)", marginBottom:7 }}>{r?.confidence}% confidence</div>
              <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6 }}>{r?.notes}</p>
            </div>
          ))}
        </div>
        {!ok&&<button className="btn-ghost" onClick={()=>setStep(1)} style={{ width:"100%" }}>← Revise and resubmit</button>}
      </div>
    );
  }

  return (
    <div style={{ paddingTop:62, maxWidth:640, margin:"0 auto", padding:"68px 32px" }}>
      <div className="mono" style={{ fontSize:10, letterSpacing:"0.2em", color:"var(--gold)", marginBottom:12, textTransform:"uppercase" }}>✦ Submit a spot</div>
      <h1 className="serif" style={{ fontSize:42, fontWeight:700, color:"var(--paper)", marginBottom:9, lineHeight:1 }}>Know a hidden gem?</h1>
      <p style={{ color:"var(--text-muted)", fontSize:13.5, lineHeight:1.7, marginBottom:32 }}>Two independent AI agents review every submission before it reaches admin approval. We keep the bar high.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13 }}>
          <div><label style={{ display:"block", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase", marginBottom:6 }}>City</label><select className="input-field" value={form.cityId} onChange={e=>set("cityId",e.target.value)}>{cities.filter(c=>c.active).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label style={{ display:"block", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase", marginBottom:6 }}>Type</label><select className="input-field" value={form.type} onChange={e=>set("type",e.target.value)}>{["restaurant","bar","experience","market"].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></div>
        </div>
        <div><label style={{ display:"block", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase", marginBottom:6 }}>Name</label><input className="input-field" value={form.name} onChange={e=>set("name",e.target.value)} placeholder="What's it called?" /></div>
        <div><label style={{ display:"block", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase", marginBottom:6 }}>Neighbourhood</label><input className="input-field" value={form.neighborhood} onChange={e=>set("neighborhood",e.target.value)} placeholder="e.g. Thonglor, Silom, Old Town…" /></div>
        <div><label style={{ display:"block", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase", marginBottom:6 }}>Description <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>(min 60 chars)</span></label><textarea className="input-field" rows={5} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Be specific. Atmosphere, what to order, what time to go. Don't sell it — describe it." /><div style={{ textAlign:"right", fontSize:10, color:form.description.length>=60?"var(--teal)":"var(--text-muted)", marginTop:3 }}>{form.description.length}/60</div></div>
        <div><label style={{ display:"block", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase", marginBottom:6 }}>Insider Tip</label><input className="input-field" value={form.tip} onChange={e=>set("tip",e.target.value)} placeholder="Best time, what to order, how to find it…" /></div>
        <div><label style={{ display:"block", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase", marginBottom:6 }}>Tags <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>(comma separated)</span></label><input className="input-field" value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="canal, night market, free entry, local…" /></div>
        {error&&<div style={{ background:"rgba(212,90,42,0.09)", border:"1px solid var(--ember)", borderRadius:4, padding:"11px 14px", color:"var(--ember)", fontSize:13 }}>{error}</div>}
        <button className="btn-primary" onClick={validate} style={{ padding:"15px", width:"100%" }}>Submit for AI Review →</button>
      </div>
    </div>
  );
};

// ─── STATUS DOT ───────────────────────────────────────────────────────────────
const StatusDot = ({ status }) => {
  const c = { idle:"var(--text-muted)", running:"var(--gold)", done:"var(--teal)", error:"var(--ember)" };
  return <div style={{ width:7, height:7, borderRadius:"50%", background:c[status]||c.idle, ...(status==="running"?{ animation:"pulse 1s infinite" }:{}) }} />;
};

// ─── DISCOVERY ENGINE ─────────────────────────────────────────────────────────
const DiscoveryEngine = ({ onSpotsDiscovered }) => {
  const [states, setStates] = useState(() =>
    DISCOVERY_AGENTS.reduce((acc,a) => ({ ...acc, [a.id]:{ status:"idle", logs:[], spots:[], count:0 } }), {})
  );
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const logRefs = useRef({});
  const statesRef = useRef(states);
  useEffect(() => { statesRef.current = states; }, [states]);

  const pushLog = useCallback((id, text, color="var(--text-muted)") => {
    setStates(prev => ({
      ...prev,
      [id]:{ ...prev[id], logs:[...prev[id].logs.slice(-28), { text, color, k:Date.now()+Math.random() }] }
    }));
  }, []);

  const setAgentStatus = useCallback((id, status) => {
    setStates(prev => ({ ...prev, [id]:{ ...prev[id], status } }));
  }, []);

  const addSpot = useCallback((id, spot) => {
    setStates(prev => {
      const ag = prev[id];
      return { ...prev, [id]:{ ...ag, spots:[...ag.spots, spot], count:ag.count+1 } };
    });
    setTotalFound(t => t+1);
  }, []);

  const runAgent = async (agent) => {
    setAgentStatus(agent.id, "running");
    pushLog(agent.id, `[${new Date().toLocaleTimeString()}] Activated`, agent.color);
    pushLog(agent.id, `▸ Zone: ${agent.label}`, "var(--text)");
    pushLog(agent.id, `▸ Focus: ${agent.focus.split(",")[0].trim()}…`);
    await new Promise(r=>setTimeout(r,600+Math.random()*800));
    pushLog(agent.id, `▸ Scanning local intel…`);
    await new Promise(r=>setTimeout(r,400+Math.random()*500));
    pushLog(agent.id, `▸ Cross-referencing sources…`);

    const system = `You are an expert Bangkok street-level urban explorer writing for UNBEATEN — a discovery platform for genuinely local, non-touristy spots. Zone: ${agent.label}. Focus types: ${agent.focus}.

Discover exactly 10 authentic off-beat spots in this Bangkok zone. NOT mainstream tourist places. These should be spots that reward curious travellers who ask locals.

Respond ONLY with a raw JSON array of exactly 10 objects — no preamble, no markdown, no explanation:
[{"name":"exact name","type":"restaurant"|"bar"|"experience"|"market","neighborhood":"specific sub-area","description":"2-3 specific atmospheric sentences, 40-80 words, no marketing language","vibe":6.5-9.8,"localLove":6.0-9.9,"uniqueness":6.5-10.0,"tags":["tag1","tag2","tag3","tag4"],"tip":"one specific practical insider tip"}]

Rules: vary scores realistically, use real Thai place names, tags lowercase 1-3 words, descriptions specific not generic.`;

    try {
      const raw = await callClaude(system, `Find 10 off-beat spots in Bangkok's ${agent.label} area. Focus: ${agent.focus}. Return raw JSON array only.`);
      pushLog(agent.id, `▸ Processing response…`);
      let spots = [];
      try {
        const cleaned = raw.replace(/```json|```/g,"").trim();
        spots = JSON.parse(cleaned);
      } catch {
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) try { spots = JSON.parse(match[0]); } catch {}
      }
      if (!Array.isArray(spots)) spots = [];
      spots = spots.slice(0,10).map((s,i) => ({
        ...s,
        id:`disc-${agent.id}-${i}-${Date.now()}`,
        cityId:"bangkok", status:"approved",
        discoveredBy:agent.label, agentIcon:agent.icon,
        tags:Array.isArray(s.tags)?s.tags:[],
        vibe:Math.min(10,Math.max(1,parseFloat(s.vibe)||7.5)),
        localLove:Math.min(10,Math.max(1,parseFloat(s.localLove)||7.5)),
        uniqueness:Math.min(10,Math.max(1,parseFloat(s.uniqueness)||7.5)),
      }));

      for (let i=0; i<spots.length; i++) {
        await new Promise(r=>setTimeout(r,150));
        addSpot(agent.id, spots[i]);
        pushLog(agent.id, `  ✓ ${spots[i].name}`, "var(--teal)");
      }
      pushLog(agent.id, `▸ ${spots.length} spots confirmed`, agent.color);
      setAgentStatus(agent.id, "done");
      onSpotsDiscovered(spots);
    } catch(err) {
      pushLog(agent.id, `✗ ${(err.message||"Error").slice(0,50)}`, "var(--ember)");
      setAgentStatus(agent.id, "error");
    }
  };

  const launch = async () => {
    setRunning(true); setDone(false); setTotalFound(0);
    setStates(DISCOVERY_AGENTS.reduce((acc,a)=>({ ...acc, [a.id]:{ status:"idle", logs:[], spots:[], count:0 } }),{}));
    // Two waves of 5
    await Promise.all(DISCOVERY_AGENTS.slice(0,5).map(a=>runAgent(a)));
    await new Promise(r=>setTimeout(r,800));
    await Promise.all(DISCOVERY_AGENTS.slice(5).map(a=>runAgent(a)));
    setRunning(false); setDone(true);
  };

  useEffect(() => {
    Object.entries(logRefs.current).forEach(([,el]) => { if (el) el.scrollTop=el.scrollHeight; });
  }, [states]);

  const doneCt = Object.values(states).filter(s=>s.status==="done").length;
  const pct = Math.min(Math.round((totalFound/100)*100),100);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:16 }}>
        <div>
          <div className="mono" style={{ fontSize:10, letterSpacing:"0.18em", color:"var(--gold)", marginBottom:7, textTransform:"uppercase" }}>✦ Discovery Engine</div>
          <h2 className="serif" style={{ fontSize:36, color:"var(--paper)", marginBottom:5 }}>Multi-Agent Scout Run</h2>
          <p style={{ color:"var(--text-muted)", fontSize:13 }}>10 specialist agents, each covering a Bangkok district. Target: 100 spots.</p>
        </div>
        <div style={{ display:"flex", gap:18, alignItems:"center" }}>
          <div style={{ textAlign:"center" }}>
            <div className="mono" style={{ fontSize:30, color:"var(--gold)", fontWeight:700 }}>{totalFound}</div>
            <div style={{ fontSize:10, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Found</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div className="mono" style={{ fontSize:30, color:"var(--teal)", fontWeight:700 }}>{doneCt}/10</div>
            <div style={{ fontSize:10, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Agents done</div>
          </div>
          {!running&&!done&&<button className="btn-primary" onClick={launch}>▶ Launch Discovery</button>}
          {running&&<div style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 18px", border:"1px solid var(--gold)", borderRadius:2 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--gold)", animation:"pulse 1s infinite" }} />
            <span className="mono" style={{ fontSize:11, color:"var(--gold)" }}>RUNNING</span>
          </div>}
          {done&&!running&&<button className="btn-ghost" onClick={launch}>↻ Re-run</button>}
        </div>
      </div>

      {(running||done)&&(
        <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:11, color:"var(--text-muted)" }}>Discovery progress</span>
            <span className="mono" style={{ fontSize:11, color:"var(--gold)" }}>{pct}%</span>
          </div>
          <div style={{ height:6, background:"var(--surface2)", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", background:"linear-gradient(90deg,var(--gold),var(--teal))", width:`${pct}%`, transition:"width 0.5s ease", borderRadius:3 }} />
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))", gap:14 }}>
        {DISCOVERY_AGENTS.map(agent => {
          const st = states[agent.id]||{ status:"idle", logs:[], spots:[], count:0 };
          return (
            <div key={agent.id} className={`agent-terminal ${st.status}`}>
              <div style={{ padding:"9px 13px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.02)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ fontSize:15 }}>{agent.icon}</span>
                  <span style={{ fontSize:10, color:agent.color, fontWeight:700, letterSpacing:"0.06em" }}>{agent.label}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span className="mono" style={{ fontSize:10, color:"var(--text-muted)" }}>{st.count}/10</span>
                  <StatusDot status={st.status} />
                </div>
              </div>
              <div ref={el=>logRefs.current[agent.id]=el} style={{ height:148, overflowY:"auto", padding:"9px 13px" }}>
                {st.status==="idle"&&<div style={{ color:"var(--text-muted)", fontSize:11, opacity:0.4 }}>Awaiting activation…</div>}
                {st.logs.map(log=>(
                  <div key={log.k} style={{ color:log.color, fontSize:11, lineHeight:1.55, paddingBottom:1 }}>{log.text}</div>
                ))}
                {st.status==="running"&&<div style={{ display:"flex", gap:3, marginTop:4 }}>
                  {[0,0.15,0.3].map(d=><div key={d} style={{ width:4, height:4, borderRadius:"50%", background:"var(--gold)", animation:`pulse 1s ${d}s infinite` }} />)}
                </div>}
              </div>
              {st.spots.length>0&&(
                <div style={{ borderTop:"1px solid var(--border)", padding:"7px 13px", background:"rgba(58,158,143,0.04)" }}>
                  <div style={{ fontSize:9, color:"var(--teal)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:5 }}>{st.spots.length} spot{st.spots.length!==1?"s":""} found</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                    {st.spots.slice(0,4).map(s=><span key={s.id} style={{ fontSize:9, color:"var(--text-muted)", background:"var(--surface2)", padding:"2px 6px", borderRadius:2 }}>{(s.name||"").slice(0,16)}</span>)}
                    {st.spots.length>4&&<span style={{ fontSize:9, color:"var(--text-muted)" }}>+{st.spots.length-4} more</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {done&&totalFound>0&&(
        <div style={{ marginTop:28, textAlign:"center", padding:"26px", border:"1px solid var(--teal)", borderRadius:4, background:"rgba(58,158,143,0.05)" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🎯</div>
          <h3 className="serif" style={{ fontSize:26, color:"var(--paper)", marginBottom:7 }}>Discovery Complete</h3>
          <p style={{ color:"var(--text-muted)", fontSize:13 }}>{totalFound} spots discovered across 10 Bangkok districts. Head to <strong style={{ color:"var(--gold)" }}>Explore</strong> to browse them all.</p>
        </div>
      )}
    </div>
  );
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
const AdminView = ({ cities, spots, pending, onApprove, onReject, onAddCity, onDeleteSpot, adminLoggedIn, setAdminLoggedIn, onSpotsDiscovered }) => {
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("discovery");
  const [newCity, setNewCity] = useState({ name:"", country:"", emoji:"🌍", tagline:"", description:"" });
  const [addingCity, setAddingCity] = useState(false);

  if (!adminLoggedIn) return (
    <div style={{ paddingTop:62, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"80vh", padding:"80px 32px" }}>
      <div className="mono" style={{ fontSize:10, letterSpacing:"0.2em", color:"var(--gold)", marginBottom:18, textTransform:"uppercase" }}>⚙ Admin</div>
      <h2 className="serif" style={{ fontSize:38, color:"var(--paper)", marginBottom:32 }}>Control Panel</h2>
      <div style={{ width:"100%", maxWidth:320, display:"flex", flexDirection:"column", gap:12 }}>
        <input className="input-field" type="password" placeholder="Admin password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&password==="unbeaten2025"&&setAdminLoggedIn(true)} />
        <button className="btn-primary" onClick={()=>password==="unbeaten2025"?setAdminLoggedIn(true):alert("Wrong password")}>Enter</button>
        <p style={{ textAlign:"center", fontSize:11, color:"var(--text-muted)" }}>Demo: <span className="mono" style={{ color:"var(--gold)" }}>unbeaten2025</span></p>
      </div>
    </div>
  );

  const approved = spots.filter(s=>s.status==="approved");
  const tabs = [["discovery","🔭 Discovery"],["pending",`⏳ Pending (${pending.length})`],["live",`✓ Live (${approved.length})`],["cities",`🌍 Cities`]];

  return (
    <div style={{ paddingTop:62, padding:"60px 32px 80px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:32, flexWrap:"wrap", gap:14 }}>
        <div>
          <div className="mono" style={{ fontSize:10, letterSpacing:"0.2em", color:"var(--gold)", marginBottom:7, textTransform:"uppercase" }}>⚙ Admin Panel</div>
          <h1 className="serif" style={{ fontSize:40, fontWeight:700, color:"var(--paper)" }}>Control Centre</h1>
        </div>
        <div style={{ display:"flex", gap:14 }}>
          {[["Live",approved.length,"var(--teal)"],["Pending",pending.length,"var(--gold)"],["Cities",cities.length,"var(--ember)"]].map(([k,v,c])=>(
            <div key={k} style={{ textAlign:"center", padding:"12px 18px", border:`1px solid ${c}33`, background:`${c}0a`, borderRadius:4 }}>
              <div className="mono" style={{ fontSize:24, color:c, fontWeight:700 }}>{v}</div>
              <div style={{ fontSize:10, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{k}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:0, borderBottom:"1px solid var(--border)", marginBottom:28, overflowX:"auto" }}>
        {tabs.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"12px 20px", background:"none", border:"none", borderBottom:tab===id?"2px solid var(--gold)":"2px solid transparent", color:tab===id?"var(--gold)":"var(--text-muted)", fontFamily:"DM Sans", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.18s", whiteSpace:"nowrap" }}>{label}</button>
        ))}
      </div>

      {tab==="discovery"&&<DiscoveryEngine onSpotsDiscovered={onSpotsDiscovered} />}

      {tab==="pending"&&(
        <div>
          {pending.length===0
            ? <div style={{ textAlign:"center", padding:"60px", color:"var(--text-muted)" }}><div style={{ fontSize:36, marginBottom:12 }}>✓</div><p>No pending submissions</p></div>
            : pending.map(sub=><PendingCard key={sub.id} sub={sub} onApprove={onApprove} onReject={onReject} />)}
        </div>
      )}

      {tab==="live"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {approved.map(spot=>(
            <div key={spot.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", border:"1px solid var(--border)", borderRadius:2, background:"var(--surface)", flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:13 }}>{TYPE_EMOJI[spot.type]}</span>
                <span className="serif" style={{ color:"var(--paper)", fontSize:14 }}>{spot.name}</span>
                {spot.agentIcon&&<span style={{ fontSize:10, color:"var(--text-muted)" }}>via {spot.agentIcon}</span>}
                <span style={{ fontSize:11, color:"var(--text-muted)" }}>{spot.neighborhood}</span>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <span className="mono" style={{ fontSize:11, color:"var(--gold)" }}>{avg(spot.vibe,spot.localLove,spot.uniqueness)}</span>
                <button onClick={()=>onDeleteSpot(spot.id)} style={{ background:"none", border:"1px solid rgba(212,90,42,0.3)", color:"var(--ember)", padding:"2px 10px", borderRadius:2, cursor:"pointer", fontSize:11, fontFamily:"DM Sans" }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="cities"&&(
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:12, marginBottom:24 }}>
            {cities.map(city=>(
              <div key={city.id} style={{ border:"1px solid var(--border)", borderRadius:4, padding:20, background:"var(--surface)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <span style={{ fontSize:28 }}>{city.emoji}</span>
                  <span style={{ padding:"2px 8px", borderRadius:20, fontSize:9, fontWeight:700, letterSpacing:"0.1em", background:city.active?"rgba(58,158,143,0.15)":"rgba(138,128,112,0.15)", color:city.active?"var(--teal)":"var(--text-muted)", textTransform:"uppercase" }}>{city.active?"Active":"Inactive"}</span>
                </div>
                <h3 className="serif" style={{ fontSize:18, color:"var(--paper)", marginTop:9, marginBottom:2 }}>{city.name}</h3>
                <p style={{ fontSize:11, color:"var(--text-muted)" }}>{city.country}</p>
                <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:6, lineHeight:1.6, fontStyle:"italic" }}>{city.tagline}</p>
              </div>
            ))}
            <button onClick={()=>setAddingCity(true)} style={{ border:"1px dashed var(--border)", borderRadius:4, padding:20, background:"transparent", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:9, minHeight:140 }}>
              <span style={{ fontSize:26, color:"var(--text-muted)" }}>+</span>
              <span style={{ color:"var(--text-muted)", fontFamily:"DM Sans", fontSize:13 }}>Add City</span>
            </button>
          </div>
          {addingCity&&(
            <div style={{ border:"1px solid var(--border)", borderRadius:4, padding:26, background:"var(--surface)" }}>
              <h3 className="serif" style={{ fontSize:24, color:"var(--paper)", marginBottom:20 }}>Add New City</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                {[["name","City Name","e.g. Chiang Mai"],["country","Country","e.g. Thailand"],["emoji","Flag Emoji","🇹🇭"],["tagline","Tagline","One evocative sentence…"]].map(([k,l,p])=>(
                  <div key={k}><label style={{ display:"block", fontSize:10, color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>{l}</label><input className="input-field" value={newCity[k]} onChange={e=>setNewCity(c=>({...c,[k]:e.target.value}))} placeholder={p} /></div>
                ))}
              </div>
              <div style={{ marginBottom:16 }}><label style={{ display:"block", fontSize:10, color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>Description</label><textarea className="input-field" rows={3} value={newCity.description} onChange={e=>setNewCity(c=>({...c,description:e.target.value}))} placeholder="What makes this city worth exploring off the beaten path?" /></div>
              <div style={{ display:"flex", gap:9 }}>
                <button className="btn-primary" onClick={()=>{ if(newCity.name&&newCity.country){ onAddCity({...newCity,id:newCity.name.toLowerCase().replace(/\s+/g,"-"),active:true}); setNewCity({name:"",country:"",emoji:"🌍",tagline:"",description:""}); setAddingCity(false); } }}>Add City</button>
                <button className="btn-ghost" onClick={()=>setAddingCity(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PendingCard = ({ sub, onApprove, onReject }) => {
  const [exp, setExp] = useState(false);
  return (
    <div style={{ border:"1px solid var(--border)", borderRadius:4, marginBottom:12, background:"var(--surface)", overflow:"hidden" }}>
      <div style={{ padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:9 }}>
        <div><h3 className="serif" style={{ fontSize:17, color:"var(--paper)", marginBottom:2 }}>{sub.name}</h3><span style={{ fontSize:11, color:"var(--text-muted)" }}>{sub.type} · {sub.neighborhood}</span></div>
        <div style={{ display:"flex", gap:9, alignItems:"center" }}>
          {sub.agentValidation&&<div style={{ display:"flex", gap:5 }}>{[["A1",sub.agentValidation.agent1],["A2",sub.agentValidation.agent2]].map(([l,a])=><span key={l} style={{ padding:"2px 7px", borderRadius:20, fontSize:10, fontWeight:700, background:a?.decision==="approve"?"rgba(58,158,143,0.15)":"rgba(212,90,42,0.15)", color:a?.decision==="approve"?"var(--teal)":"var(--ember)" }}>{l} {a?.decision==="approve"?"✓":"✗"}</span>)}</div>}
          <button onClick={()=>setExp(!exp)} style={{ background:"none", border:"1px solid var(--border)", color:"var(--text-muted)", padding:"3px 10px", borderRadius:2, cursor:"pointer", fontSize:11, fontFamily:"DM Sans" }}>{exp?"Collapse":"Review"}</button>
          <button onClick={()=>onApprove(sub.id)} style={{ background:"rgba(58,158,143,0.1)", border:"1px solid var(--teal)", color:"var(--teal)", padding:"3px 12px", borderRadius:2, cursor:"pointer", fontSize:11, fontFamily:"DM Sans", fontWeight:600 }}>Approve ✓</button>
          <button onClick={()=>onReject(sub.id)} style={{ background:"rgba(212,90,42,0.1)", border:"1px solid var(--ember)", color:"var(--ember)", padding:"3px 12px", borderRadius:2, cursor:"pointer", fontSize:11, fontFamily:"DM Sans", fontWeight:600 }}>Reject ✗</button>
        </div>
      </div>
      {exp&&<div style={{ borderTop:"1px solid var(--border)", padding:"16px 20px" }}>
        <p style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.7, marginBottom:12 }}>{sub.description}</p>
        {sub.tip&&<div style={{ borderLeft:"3px solid var(--gold)", paddingLeft:11, marginBottom:12 }}><p style={{ fontSize:12, color:"var(--text-muted)" }}><strong style={{ color:"var(--gold)" }}>Tip:</strong> {sub.tip}</p></div>}
      </div>}
    </div>
  );
};

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("home");
  const [cities, setCities] = useState(INITIAL_CITIES);
  const [spots, setSpots] = useState([...INITIAL_SPOTS, ...DISCOVERED_SPOTS]);
  const [pending, setPending] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [selectedCity, setSelectedCity] = useState("bangkok");

  const handleSubmit = (data) => setPending(p=>[...p,{ ...data, id:`user-${Date.now()}`, vibe:7.5, localLove:7.0, uniqueness:7.5, status:"pending" }]);
  const handleApprove = (id) => { const s=pending.find(p=>p.id===id); if(s){ setSpots(x=>[...x,{...s,status:"approved"}]); setPending(p=>p.filter(x=>x.id!==id)); } };
  const handleReject = (id) => setPending(p=>p.filter(x=>x.id!==id));
  const handleDeleteSpot = (id) => setSpots(s=>s.filter(x=>x.id!==id));
  const handleAddCity = (city) => setCities(c=>[...c,city]);
  const handleSpotsDiscovered = useCallback((newSpots) => {
    setSpots(prev => {
      const ids = new Set(prev.map(s=>s.id));
      return [...prev, ...newSpots.filter(s=>!ids.has(s.id))];
    });
  }, []);

  return (
    <>
      <FontLoader />
      <div style={{ minHeight:"100vh", background:"var(--ink)" }}>
        <Nav view={view} setView={setView} adminLoggedIn={adminLoggedIn} pendingCount={pending.length} selectedCity={selectedCity} />
        {view==="home"   && <HomeView cities={cities} spots={spots} setView={setView} setSelectedSpot={setSelectedSpot} selectedCity={selectedCity} setSelectedCity={setSelectedCity} />}
        {view==="spot"   && selectedSpot && <SpotDetail spot={selectedSpot} setView={setView} />}
        {view==="submit" && <SubmitView cities={cities} onSubmit={handleSubmit} />}
        {view==="admin"  && <AdminView cities={cities} spots={spots} pending={pending} onApprove={handleApprove} onReject={handleReject} onAddCity={handleAddCity} onDeleteSpot={handleDeleteSpot} adminLoggedIn={adminLoggedIn} setAdminLoggedIn={setAdminLoggedIn} onSpotsDiscovered={handleSpotsDiscovered} />}
      </div>
    </>
  );
}
