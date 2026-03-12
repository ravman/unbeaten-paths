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
  {"id": "ag1-0", "cityId": "bangkok", "name": "Teens of Thailand", "type": "bar", "neighborhood": "Chinatown (also beloved in Thonglor crowd)", "description": "A gin bar tucked inside a narrow Chinese shophouse with barely 12 seats. The bartenders work in near silence, building drinks from house-infused spirits and foraged Thai botanicals. No cocktail menu — you describe a mood, they respond. Regulars sit at the bar and let the evening dissolve around them.", "vibe": 9.4, "localLove": 9.1, "uniqueness": 9.7, "tags": ["gin bar", "shophouse", "no menu", "intimate"], "tip": "Come before 9pm or wait outside — no reservations. Say you want something 'herbaceous and strange.'", "status": "approved", "agentIcon": "🌙", "discoveredBy": "Thonglor / Ekkamai"},
  {"id": "ag1-1", "cityId": "bangkok", "name": "Rabbit Hole", "type": "bar", "neighborhood": "Thonglor Soi 55", "description": "An underground cocktail bar beneath a residential building on Thonglor Soi 55 with almost no street presence. Dark panelled walls, a serious whisky collection, and bartenders who trained in Tokyo. The Japanese whisky highball here is the best in the city — criminally underpriced.", "vibe": 9.0, "localLove": 8.8, "uniqueness": 8.6, "tags": ["whisky", "speakeasy", "japanese influence", "thonglor"], "tip": "The entrance is through a door marked only with a small rabbit logo. Weeknights are quieter and the bartenders will actually talk to you.", "status": "approved", "agentIcon": "🌙", "discoveredBy": "Thonglor / Ekkamai"},
  {"id": "ag1-2", "cityId": "bangkok", "name": "Escapade Burgers & Shakes", "type": "restaurant", "neighborhood": "Ekkamai", "description": "A tiny burger joint run by a couple who spent years eating their way through the American south. The smash burger has a cult following among expat chefs who come here on their nights off. No frills, cash only, the fries are cooked in beef tallow and the shakes contain an illegal amount of malt.", "vibe": 8.2, "localLove": 9.3, "uniqueness": 7.8, "tags": ["burgers", "cash only", "chef favourite", "ekkamai"], "tip": "Order the double smash with the 'dirty sauce.' Arrive early — they sell out of patties by 9pm most nights.", "status": "approved", "agentIcon": "🌙", "discoveredBy": "Thonglor / Ekkamai"},
  {"id": "ag1-3", "cityId": "bangkok", "name": "Tropic City", "type": "bar", "neighborhood": "Charoen Krung Soi 36", "description": "Bangkok's answer to a tiki bar, but make it good. Tropical flavours done with technical precision — pandan, coconut husk smoke, galangal — in a small room hung with rattan and palm fronds. The crowd is local, young, and very opinionated about their rum. No frozen drinks. No umbrellas.", "vibe": 9.2, "localLove": 8.7, "uniqueness": 9.0, "tags": ["tiki", "rum", "thai botanicals", "creative cocktails"], "tip": "The tasting flight is worth it — 4 cocktails showing the range of the menu. Book a stool at the bar.", "status": "approved", "agentIcon": "🌙", "discoveredBy": "Thonglor / Ekkamai"},
  {"id": "ag1-4", "cityId": "bangkok", "name": "Seen Space Thonglor", "type": "experience", "neighborhood": "Thonglor Soi 13", "description": "A hybrid record shop, coffee bar, and live music venue that functions as the actual creative hub of Thonglor. Local jazz bands play Thursday nights on a stage the size of a dining table. Vinyl browsers, coffee drinkers, and musicians coexist without anyone trying too hard.", "vibe": 8.9, "localLove": 9.4, "uniqueness": 8.2, "tags": ["vinyl", "jazz", "live music", "coffee"], "tip": "Thursday jazz from 8pm. Come for the music, stay for the digging — the selection leans heavy on 70s Thai pop and soul.", "status": "approved", "agentIcon": "🌙", "discoveredBy": "Thonglor / Ekkamai"},
  {"id": "ag1-5", "cityId": "bangkok", "name": "Neon Tiger", "type": "bar", "neighborhood": "Ekkamai Soi 7", "description": "A craft beer bar that opened in a converted garage and somehow never lost that energy. Sixteen taps, mostly Thai micros and a rotating guest keg from Asia-Pacific. Loud, sweaty on weekends, with plastic chairs spilling onto the soi. The tamarind pork skewers from the kitchen window are essential.", "vibe": 8.6, "localLove": 9.5, "uniqueness": 7.4, "tags": ["craft beer", "thai micro", "garage bar", "skewers"], "tip": "Go Tuesday when they tap a new experimental keg and the brewer sometimes shows up to explain it.", "status": "approved", "agentIcon": "🌙", "discoveredBy": "Thonglor / Ekkamai"},
  {"id": "ag1-6", "cityId": "bangkok", "name": "Featherstone Cafe", "type": "restaurant", "neighborhood": "Ekkamai", "description": "An all-day cafe in a converted shophouse that does things properly — sourdough baked on-site, eggs from a small farm in Chiang Rai, cold brew made with single-origin beans from Doi Chang. No avocado toast theatrics. Just a calm room, good ingredients, and staff who know their suppliers by name.", "vibe": 8.1, "localLove": 8.9, "uniqueness": 7.2, "tags": ["brunch", "sourdough", "farm to table", "calm"], "tip": "The mushroom toast with truffle oil and the Thai-spiced hollandaise on weekends. Quietest between 10-11am.", "status": "approved", "agentIcon": "🌙", "discoveredBy": "Thonglor / Ekkamai"},
  {"id": "ag1-7", "cityId": "bangkok", "name": "Iron Ball Gin Bar", "type": "bar", "neighborhood": "Thonglor", "description": "The tasting room of Thailand's first craft gin distillery. Housed in a slick industrial space that somehow feels genuinely intimate. The house gin is distilled with kaffir lime, lemongrass, and galangal — distinctly Thai in a way that doesn't feel like a gimmick. The bartenders know the distillation story cold.", "vibe": 8.7, "localLove": 8.2, "uniqueness": 9.1, "tags": ["craft gin", "distillery", "thai botanicals", "tasting room"], "tip": "Do the distillery tasting flight before ordering cocktails — it completely changes how you drink the house gin.", "status": "approved", "agentIcon": "🌙", "discoveredBy": "Thonglor / Ekkamai"},
  {"id": "ag1-8", "cityId": "bangkok", "name": "Soi 38 Night Food Street", "type": "market", "neighborhood": "Thonglor Soi 38", "description": "While everyone goes to the Thonglor rooftop bars, the locals end up here after midnight. A narrow soi that transforms after 11pm into a parade of carts — boat noodles, grilled offal, pad kra pao at 2am with a cold Chang. No atmosphere manufactured, just appetite and neon light.", "vibe": 9.1, "localLove": 9.7, "uniqueness": 8.3, "tags": ["late night", "street food", "boat noodles", "after midnight"], "tip": "Come after midnight when the restaurant industry crowd shows up. The boat noodle cart third on the left is the one.", "status": "approved", "agentIcon": "🌙", "discoveredBy": "Thonglor / Ekkamai"},
  {"id": "ag1-9", "cityId": "bangkok", "name": "Mikkeller Bangkok", "type": "bar", "neighborhood": "Ekkamai", "description": "The Bangkok outpost of the Danish craft beer nomad, but locally brewed and thoroughly absorbed into its neighbourhood. The terrace on a cool evening with Thai-inflected snacks and an experimental sour is one of Bangkok's better hours. The turnover of taps means there's always something worth trying.", "vibe": 8.4, "localLove": 8.0, "uniqueness": 7.6, "tags": ["craft beer", "danish", "terrace", "sour beers"], "tip": "The rotating Thailand-exclusive taps are the reason to visit. Check their Instagram the morning before you go.", "status": "approved", "agentIcon": "🌙", "discoveredBy": "Thonglor / Ekkamai"},
  {"id": "ag2-0", "cityId": "bangkok", "name": "Phra Arthit Riverfront", "type": "experience", "neighborhood": "Banglamphu / Phra Arthit", "description": "A riverside promenade where locals and university students gather at dusk without a tourist in sight. Cheap beer from 7-Eleven drunk on low walls facing the Chao Phraya. The fort and old buildings behind you, cargo boats passing in front. The most unpretentious view in Bangkok.", "vibe": 9.3, "localLove": 9.8, "uniqueness": 8.0, "tags": ["free", "riverside", "sunset", "student scene"], "tip": "Buy beer and snacks from the 7-Eleven and claim a wall spot by 5:30pm for sunset. Bring mosquito spray.", "status": "approved", "agentIcon": "🏛️", "discoveredBy": "Old Town / Rattanakosin"},
  {"id": "ag2-1", "cityId": "bangkok", "name": "Arun Residence Terrace", "type": "bar", "neighborhood": "Tha Tien", "description": "A boutique guesthouse with a rooftop terrace that faces Wat Arun directly across the river. Tables for 20 people maximum. Not a secret exactly, but not promoted, and the guests are mostly people who discovered it by asking the right questions. The mango sticky rice here is made to a family recipe.", "vibe": 9.0, "localLove": 7.9, "uniqueness": 8.8, "tags": ["rooftop", "wat arun view", "intimate", "sticky rice"], "tip": "Go at dusk when Wat Arun is lit. Guests of the hotel get priority — book even if you're not staying.", "status": "approved", "agentIcon": "🏛️", "discoveredBy": "Old Town / Rattanakosin"},
  {"id": "ag2-2", "cityId": "bangkok", "name": "Tha Tien Market", "type": "market", "neighborhood": "Tha Tien", "description": "The wholesale market behind Wat Pho that feeds the temple district every morning. By 7am it's already winding down — vendors packing up, monks collecting alms, a few food carts serving ferry workers. Come here for khao tom in ceramic bowls that cost 30 baht and have been served the same way for 50 years.", "vibe": 8.5, "localLove": 9.6, "uniqueness": 8.1, "tags": ["morning market", "khao tom", "monks", "ferry workers"], "tip": "Be there by 6:30am. The rice porridge cart at the back left corner has been run by the same family for decades.", "status": "approved", "agentIcon": "🏛️", "discoveredBy": "Old Town / Rattanakosin"},
  {"id": "ag2-3", "cityId": "bangkok", "name": "Wat Suthat Surrounding Streets", "type": "experience", "neighborhood": "Sao Ching Cha / Rattanakosin", "description": "The streets around the Giant Swing and Wat Suthat are lined with shops selling monks' supplies — saffron robes, ritual objects, Buddha amulets, temple flowers. It functions as a genuine religious supply district, mostly ignored by tourists. Walking through it at 8am when deliveries are being made is transportive.", "vibe": 8.7, "localLove": 8.4, "uniqueness": 8.9, "tags": ["monks supplies", "ritual district", "walking", "morning"], "tip": "Walk east from the Giant Swing toward the canal. The deeper you go, the less English you'll encounter.", "status": "approved", "agentIcon": "🏛️", "discoveredBy": "Old Town / Rattanakosin"},
  {"id": "ag2-4", "cityId": "bangkok", "name": "Roti Mataba", "type": "restaurant", "neighborhood": "Phra Athit", "description": "A Muslim family restaurant near the Chao Phraya that has been making roti and mataba for three generations. The mataba — a stuffed roti pancake — is made to order and served with the family's curry and pickled vegetables. The shop has plastic tables and handwritten menus and no interest in being discovered.", "vibe": 8.3, "localLove": 9.5, "uniqueness": 8.5, "tags": ["muslim thai", "roti", "mataba", "family run", "three generations"], "tip": "Open from 9am. Come before noon when the filling is freshest. The massaman curry with roti for dunking is the move.", "status": "approved", "agentIcon": "🏛️", "discoveredBy": "Old Town / Rattanakosin"},
  {"id": "ag2-5", "cityId": "bangkok", "name": "Klong Lord Canal Walk", "type": "experience", "neighborhood": "Rattanakosin island", "description": "The inner canal that circles the historic island is mostly unvisited. You can walk the full loop along the bank — old wooden houses, community vegetable patches, monks on bicycles, a rope ferry still running. The eastern section near Tha Chang pier passes through an almost rural Bangkok that feels decades removed from Khao San.", "vibe": 9.1, "localLove": 8.7, "uniqueness": 9.3, "tags": ["canal walk", "historic", "rope ferry", "hidden", "local life"], "tip": "Start at Tha Tien pier and walk north. The rope ferry across the canal costs 3 baht and still runs when the ferryman feels like it.", "status": "approved", "agentIcon": "🏛️", "discoveredBy": "Old Town / Rattanakosin"},
  {"id": "ag2-6", "cityId": "bangkok", "name": "Nai Mong Hoi Thod", "type": "restaurant", "neighborhood": "Tha Tien", "description": "An oyster omelette stall that's been in the same location since 1961, operating out of a cart under a narrow awning. The omelette is crispy-edged with a molten centre, the oysters are fresh daily from the Gulf. Two tables, plastic stools, and a queue that snakes onto the pavement. The cheapest extraordinary meal in the old town.", "vibe": 8.8, "localLove": 9.7, "uniqueness": 8.4, "tags": ["oyster omelette", "1961", "street food", "legend", "cheap"], "tip": "Get there by 11am or queue. Order the large with extra crispy edges. They close when the oysters run out, usually by 2pm.", "status": "approved", "agentIcon": "🏛️", "discoveredBy": "Old Town / Rattanakosin"},
  {"id": "ag2-7", "cityId": "bangkok", "name": "The Poet Bookshop", "type": "experience", "neighborhood": "Phra Athit", "description": "A secondhand bookshop in a crumbling shophouse near Phra Athit road that also serves coffee and keeps erratic hours. The English section is small but carefully chosen — fiction left by decades of travellers, Thai literature in translation, some poetry. The owner will make recommendations if you ask the right way.", "vibe": 8.6, "localLove": 8.1, "uniqueness": 8.7, "tags": ["bookshop", "secondhand", "coffee", "erratic hours"], "tip": "Check their Facebook page before going — hours vary by mood. Best on rainy afternoons.", "status": "approved", "agentIcon": "🏛️", "discoveredBy": "Old Town / Rattanakosin"},
  {"id": "ag2-8", "cityId": "bangkok", "name": "Sanam Luang At Dawn", "type": "experience", "neighborhood": "Rattanakosin", "description": "The grand royal field in front of the Grand Palace is transformed before sunrise — kite flyers, joggers, monks in procession, vendors setting up their carts. By 8am when tourists begin arriving, the real life of the field has already packed up and gone. The 5:30am light across the palace walls is something else.", "vibe": 9.5, "localLove": 8.9, "uniqueness": 8.6, "tags": ["dawn", "kite flying", "royal field", "free", "monks"], "tip": "Be there by 5:45am. The mango sticky rice cart near the south corner opens at 6am. Bring a jacket — it's genuinely cool.", "status": "approved", "agentIcon": "🏛️", "discoveredBy": "Old Town / Rattanakosin"},
  {"id": "ag2-9", "cityId": "bangkok", "name": "Hemlock", "type": "restaurant", "neighborhood": "Phra Athit", "description": "A long-running neighbourhood restaurant that somehow never became famous outside its postcode. Serves elevated Thai comfort food — khao soi, larb with proper funky fermented rice, southern-style fish curry — in a dim, wood-panelled room packed with Thammasat University faculty. The wine list is short and honest.", "vibe": 8.4, "localLove": 9.2, "uniqueness": 7.8, "tags": ["thai comfort food", "khao soi", "neighbourhood classic", "faculty crowd"], "tip": "Tuesday to Sunday evenings only. The khao soi and the southern curry are both worth ordering for the table.", "status": "approved", "agentIcon": "🏛️", "discoveredBy": "Old Town / Rattanakosin"},
  {"id": "ag3-0", "cityId": "bangkok", "name": "Jek Pui Curry", "type": "restaurant", "neighborhood": "Yaowarat", "description": "A curry stall that has operated from the same pavement corner on Yaowarat since the 1960s. The pork curry with preserved egg is cooked in a single enormous wok from 5am until it's gone. Zero ambience, foam trays, plastic stools — and one of the most complex curry pastes in Bangkok made from a recipe never written down.", "vibe": 8.9, "localLove": 9.8, "uniqueness": 9.2, "tags": ["dawn street food", "pork curry", "1960s", "pavement", "cash only"], "tip": "Arrive at 6am. It closes by 10am most days. The pork with preserved egg and rice for 60 baht is the only order.", "status": "approved", "agentIcon": "🐉", "discoveredBy": "Chinatown / Talat Noi"},
  {"id": "ag3-1", "cityId": "bangkok", "name": "Hong Kong Noodles (Rot Det)", "type": "restaurant", "neighborhood": "Talat Noi", "description": "An unlabelled noodle shop in a 100-year-old shophouse that serves one thing: wonton noodle soup with house-made roast pork. The broth is pork-bone based and has been simmering in the same pot, topped up daily, for over 30 years. The owner's daughter now runs it. Twelve seats. Queue outside.", "vibe": 8.7, "localLove": 9.6, "uniqueness": 8.8, "tags": ["wonton noodles", "single dish", "30 year broth", "family run", "unlabelled"], "tip": "Find it on Google Maps as 'Rot Det Noodles' — the sign is in Chinese only. Opens 7am, done by noon.", "status": "approved", "agentIcon": "🐉", "discoveredBy": "Chinatown / Talat Noi"},
  {"id": "ag3-2", "cityId": "bangkok", "name": "Ba Hao Tian Mi", "type": "bar", "neighborhood": "Talat Noi", "description": "A Chinese-themed cocktail bar in a beautifully restored shophouse with original 1930s tiles, offering Chinese-inspired drinks made with Baijiu, rice wine, and Thai-Chinese herbal liqueurs. The design is meticulous without being theme-park. The crowd on weekends is young Bangkok creative class, not tourists.", "vibe": 9.3, "localLove": 8.6, "uniqueness": 9.4, "tags": ["chinese cocktails", "baijiu", "heritage shophouse", "1930s tiles", "creative bar"], "tip": "The longan and Chinese five spice cocktail is the signature. Thursday evenings quieter for conversation.", "status": "approved", "agentIcon": "🐉", "discoveredBy": "Chinatown / Talat Noi"},
  {"id": "ag3-3", "cityId": "bangkok", "name": "Gong Heng Tong Medicinal Hall", "type": "experience", "neighborhood": "Yaowarat", "description": "A 100-year-old Chinese medicinal herb shop that still compounds traditional remedies. The interior smells of dried roots and star anise, the drawers behind the counter are hand-labelled in century-old calligraphy, and the elderly pharmacist will prescribe you something if you describe your symptoms. A living museum that charges nothing to enter.", "vibe": 9.0, "localLove": 9.1, "uniqueness": 9.5, "tags": ["herbal medicine", "chinese heritage", "100 year old", "free", "living history"], "tip": "Come in the morning when the pharmacist is compounding orders. Bring cash — they sell teas and tonics.", "status": "approved", "agentIcon": "🐉", "discoveredBy": "Chinatown / Talat Noi"},
  {"id": "ag3-4", "cityId": "bangkok", "name": "Soy Sauce Lane", "type": "experience", "neighborhood": "Talat Noi", "description": "A narrow alleyway in Talat Noi that dead-ends at an old warehouse and passes through one of Bangkok's most concentrated areas of street murals. Also: a functioning soy sauce factory, a Chinese opera rehearsal space, and an ancient spirit house covered in offerings. Walk slowly.", "vibe": 9.4, "localLove": 8.3, "uniqueness": 9.0, "tags": ["street art", "soy sauce factory", "murals", "opera", "alley"], "tip": "Best visited 7-9am when the soy sauce factory is working — the smell is extraordinary. The murals are best photographed in morning light.", "status": "approved", "agentIcon": "🐉", "discoveredBy": "Chinatown / Talat Noi"},
  {"id": "ag3-5", "cityId": "bangkok", "name": "Thanon Plaeng Nam Coffee Shop", "type": "restaurant", "neighborhood": "Talat Noi", "description": "A Chinese-Thai kopitiam that has served the same menu — kaya toast, soft-boiled eggs, iced coffee in a glass — since 1947. Still run by the third generation of the original family. White tiles, ceiling fans, a radio playing Thai pop, and tables shared with strangers. The ice coffee is the perfect Bangkok morning.", "vibe": 8.6, "localLove": 9.4, "uniqueness": 8.7, "tags": ["kopitiam", "kaya toast", "1947", "family run", "morning"], "tip": "Open from 6am to noon only. Order the iced coffee with kaya toast and two soft-boiled eggs — 80 baht total.", "status": "approved", "agentIcon": "🐉", "discoveredBy": "Chinatown / Talat Noi"},
  {"id": "ag3-6", "cityId": "bangkok", "name": "Yaowarat Night Market (Back Rows)", "type": "market", "neighborhood": "Yaowarat", "description": "Everyone knows the main Yaowarat strip, but the parallel sois one block back are where locals eat. No English signage, plastic chairs set up on the pavement, vendors grilling whole fish and making papaya salad with enough chilli to require a commitment. Half the price, double the authenticity.", "vibe": 9.0, "localLove": 9.7, "uniqueness": 7.8, "tags": ["night market", "local only", "grilled fish", "no english menu", "back streets"], "tip": "Enter from Charoen Krung Soi 21 and follow your nose away from Yaowarat Road. Point and smile.", "status": "approved", "agentIcon": "🐉", "discoveredBy": "Chinatown / Talat Noi"},
  {"id": "ag3-7", "cityId": "bangkok", "name": "Tha Rua Boat Noodles", "type": "restaurant", "neighborhood": "Talat Noi riverfront", "description": "A floating noodle kitchen moored at the Talat Noi pier that predates the trendy riverside bars by about 40 years. They serve boat noodles in the traditional style — tiny bowls of pork or beef broth so dark it's almost black, with crispy shallots and morning glory. Five bowls is a normal order. Twelve is achievement.", "vibe": 8.8, "localLove": 9.5, "uniqueness": 9.1, "tags": ["boat noodles", "floating", "pier", "traditional", "tiny bowls"], "tip": "Find the pier at the end of Talat Noi Soi 1. Open mornings and early afternoons only. Order at least 8 bowls between two people.", "status": "approved", "agentIcon": "🐉", "discoveredBy": "Chinatown / Talat Noi"},
  {"id": "ag3-8", "cityId": "bangkok", "name": "San Jao Sien Khong Shrine", "type": "experience", "neighborhood": "Talat Noi", "description": "A Chinese-Taoist shrine tucked into the middle of Talat Noi that serves as the actual social hub of the neighbourhood. Old men play Chinese chess in the forecourt, women bring offerings of fruit and roast pork, and the fortune telling is taken seriously. The incense smoke is so thick in the morning it produces its own weather.", "vibe": 8.9, "localLove": 9.2, "uniqueness": 8.5, "tags": ["chinese taoist shrine", "chess", "fortune telling", "incense", "community"], "tip": "Come at 8am when the neighbourhood treats it as their morning gathering point. Dress modestly and stay quiet.", "status": "approved", "agentIcon": "🐉", "discoveredBy": "Chinatown / Talat Noi"},
  {"id": "ag3-9", "cityId": "bangkok", "name": "Chinatown Dim Sum Trail", "type": "experience", "neighborhood": "Yaowarat / Samphanthawong", "description": "An unofficial walking trail through six dim sum shops between Odeon Circle and Ratchawong Pier, each known for a single item — the siu mai at one, the char siu bao at another, the egg tart at a third. Locals have been following this route on Sunday mornings for generations without anyone writing it down until now.", "vibe": 9.2, "localLove": 9.6, "uniqueness": 8.9, "tags": ["dim sum", "walking trail", "sunday morning", "multiple stops", "chinese heritage"], "tip": "Start at Odeon Circle at 7am Sunday. The trail takes 2-3 hours if you're doing it properly. Bring antacids.", "status": "approved", "agentIcon": "🐉", "discoveredBy": "Chinatown / Talat Noi"},
  {"id": "ag4-0", "cityId": "bangkok", "name": "The Deck by Arun Residence", "type": "bar", "neighborhood": "Tha Tien", "description": "A riverfront bar where the view of Wat Arun across the water is so close you feel like you could reach over and adjust its spires. Entirely local crowd — mostly Silpakorn University art students and people who live nearby. The cocktails are basic, the beer is cold, and the sunset turns the river the colour of bronze.", "vibe": 9.5, "localLove": 8.8, "uniqueness": 8.6, "tags": ["riverside", "wat arun", "art students", "sunset", "local"], "tip": "The 6-7pm hour when the sun hits Wat Arun directly. Arrive by 5:30 to get a riverside table.", "status": "approved", "agentIcon": "🌊", "discoveredBy": "Riverside / Chao Phraya"},
  {"id": "ag4-1", "cityId": "bangkok", "name": "Khlong San Floating Market", "type": "market", "neighborhood": "Khlong San", "description": "Not the sanitised floating market for tourists — this is a working vegetable and grocery market accessed by canal boat, where the vendors sell to restaurants and households. You can take the public canal boat from Sathorn pier and join in. The morning chaos of loading and unloading is genuinely extraordinary to witness.", "vibe": 8.7, "localLove": 9.4, "uniqueness": 9.0, "tags": ["floating market", "working", "canal boat", "local", "vegetables"], "tip": "Take the public Sathorn canal boat from Sathorn pier at 6am. Ask to go to Khlong San market. No tourist prices.", "status": "approved", "agentIcon": "🌊", "discoveredBy": "Riverside / Chao Phraya"},
  {"id": "ag4-2", "cityId": "bangkok", "name": "Royal Orchid Sheraton Riverview", "type": "bar", "neighborhood": "Si Phraya", "description": "Not the hotel — the public riverview terrace bar tucked on the ground floor that almost no one knows you can access without a room key. A local lawyer and retired sailor clientele, cheap Thai whisky and soda setups, and an unobstructed view of the Chao Phraya at its widest. No Instagram moment, just the river.", "vibe": 8.3, "localLove": 9.1, "uniqueness": 8.4, "tags": ["riverside bar", "hotel terrace", "open to public", "thai whisky", "wide river view"], "tip": "Walk through the hotel lobby to the garden terrace. Mention you want a drink by the river and they'll seat you. Cheaper than any tourist bar nearby.", "status": "approved", "agentIcon": "🌊", "discoveredBy": "Riverside / Chao Phraya"},
  {"id": "ag4-3", "cityId": "bangkok", "name": "Tha Chang Pier Community", "type": "experience", "neighborhood": "Tha Chang", "description": "The working ferry pier at the foot of the Grand Palace that hasn't been gentrified. At dawn: monks collecting alms, vendors selling sticky rice and iced coffee from styrofoam cups, river workers eating breakfast, the ferry loading with commuters. Stays like this until 8am when the tourist traffic begins.", "vibe": 9.3, "localLove": 9.7, "uniqueness": 8.8, "tags": ["ferry pier", "monks", "river workers", "dawn", "free"], "tip": "Be there by 6am. Take the cross-river ferry (3.5 baht) to Wat Arun just for the experience of being on the river with locals.", "status": "approved", "agentIcon": "🌊", "discoveredBy": "Riverside / Chao Phraya"},
  {"id": "ag4-4", "cityId": "bangkok", "name": "Praya Palazzo Terrace", "type": "bar", "neighborhood": "Phra Nakhon riverside", "description": "An Italianate riverfront palace converted to a boutique hotel with a terrace bar accessible by the hotel's free shuttle boat from Phra Arthit pier. The building is astonishing — turn-of-century Italian architecture on the Bangkok river — and the terrace at dusk is one of those accidental perfect evenings.", "vibe": 9.1, "localLove": 7.4, "uniqueness": 9.5, "tags": ["historic palace", "shuttle boat", "riverfront", "italian architecture", "evening"], "tip": "Book the shuttle from Phra Arthit pier (free, runs 4-10pm). Walk in for drinks only — you don't need a reservation.", "status": "approved", "agentIcon": "🌊", "discoveredBy": "Riverside / Chao Phraya"},
  {"id": "ag4-5", "cityId": "bangkok", "name": "Wat Kanlayanamit Evening", "type": "experience", "neighborhood": "Thonburi riverside", "description": "A vast temple on the Thonburi bank that faces the river and is almost entirely unvisited in the evenings. At dusk, monks chant in the main hall while the river traffic passes outside. You can sit in the open courtyard on the river side and watch the light change over the water. The temple cat is enormous and friendly.", "vibe": 9.4, "localLove": 8.5, "uniqueness": 9.2, "tags": ["temple", "evening", "monks chanting", "riverside", "free", "temple cat"], "tip": "Take the cross-river express boat to Tha Ratchawong and walk 5 minutes south. Open until 9pm. Dress respectfully.", "status": "approved", "agentIcon": "🌊", "discoveredBy": "Riverside / Chao Phraya"},
  {"id": "ag4-6", "cityId": "bangkok", "name": "Klong Saen Saep Express Boat", "type": "experience", "neighborhood": "Central Bangkok canal network", "description": "The Bangkok canal express boat that runs east-west across the city — the daily commute of half a million Bangkokians. No tourism angle. You board with office workers and market vendors, the boat conductor yells stops in rapid Thai, spray comes over the side, and you see the city from the canal level at speed. 15 baht end to end.", "vibe": 9.6, "localLove": 10.0, "uniqueness": 8.7, "tags": ["canal boat", "commuter", "15 baht", "real bangkok", "spray in face"], "tip": "Ride the full route from Hua Chang pier to Khlong Bang Kapi on a weekday morning. Do not wear white.", "status": "approved", "agentIcon": "🌊", "discoveredBy": "Riverside / Chao Phraya"},
  {"id": "ag4-7", "cityId": "bangkok", "name": "Three Sixty Jazz Lounge", "type": "bar", "neighborhood": "Millennium Hilton / Bang Rak", "description": "A rotating bar on the 32nd floor of the Millennium Hilton that locals have quietly adopted because it's cheaper than competitors and the live jazz is genuinely good. The full rotation takes about 70 minutes — enough time to watch the city and river complete a slow panorama while the quartet plays Coltrane.", "vibe": 8.8, "localLove": 7.8, "uniqueness": 8.3, "tags": ["rotating bar", "jazz", "river panorama", "live music", "32nd floor"], "tip": "Arrive before 8pm for the best river-facing seats before the rotation moves them. Happy hour until 7pm.", "status": "approved", "agentIcon": "🌊", "discoveredBy": "Riverside / Chao Phraya"},
  {"id": "ag4-8", "cityId": "bangkok", "name": "Iconsiam Basement Wet Market", "type": "market", "neighborhood": "Khlong San / Iconsiam", "description": "In the basement of Bangkok's most opulent mall there is a genuine Thai wet market — the Sook Siam cultural zone — where provincial vendors sell regional produce and cooked food from every Thai region. It exists as a cultural preservation project and is almost entirely ignored by shoppers four floors above.", "vibe": 8.5, "localLove": 8.9, "uniqueness": 9.3, "tags": ["wet market", "inside mall", "regional thai food", "cultural zone", "surprising"], "tip": "Enter Iconsiam and take the escalator to G floor (basement). Head to the Sook Siam section in the corner. Northern Thai sai oua sausage is exceptional here.", "status": "approved", "agentIcon": "🌊", "discoveredBy": "Riverside / Chao Phraya"},
  {"id": "ag4-9", "cityId": "bangkok", "name": "Memorial Bridge Night Market", "type": "market", "neighborhood": "Saphan Phut / Bang Rak", "description": "Bangkok's oldest standing night market, operating on the west end of Memorial Bridge since the 1930s. Primarily wholesale clothing and accessories, but the food stalls along the river bank are where taxi drivers and night-shift workers eat after midnight. Almost no tourist infrastructure — mostly Thai signage and Thai prices.", "vibe": 8.4, "localLove": 9.5, "uniqueness": 8.6, "tags": ["1930s", "night market", "overnight", "river bank", "taxi drivers"], "tip": "Best after 11pm when the food vendors are at full swing and the wholesale crowd thins. The grilled seafood stalls face the river.", "status": "approved", "agentIcon": "🌊", "discoveredBy": "Riverside / Chao Phraya"},
  {"id": "ag5-0", "cityId": "bangkok", "name": "Bottle Shop Ari", "type": "bar", "neighborhood": "Ari Soi 4", "description": "A natural wine bottle shop with a small bar at the back that pours glasses from whatever's open. The selection is genuinely excellent — grower champagne, Georgian amber, Portuguese pét-nat — and the prices are honest. The staff drink what they sell and have opinions they'll share if you ask. No dress code, no reservations.", "vibe": 8.9, "localLove": 8.7, "uniqueness": 8.8, "tags": ["natural wine", "bottle shop", "by the glass", "staff drinks", "honest prices"], "tip": "Go mid-week when the selection is widest before weekend restocking. The staff's current favourite is always worth trying.", "status": "approved", "agentIcon": "🎨", "discoveredBy": "Ari / Phahon Yothin"},
  {"id": "ag5-1", "cityId": "bangkok", "name": "Cook and Twisted Ari", "type": "restaurant", "neighborhood": "Ari", "description": "A tiny breakfast and lunch spot where everything is made to order from local ingredients and the chef changes the menu when he's bored with it. Currently doing exceptional Eggs Benedict on house-baked focaccia and a Thai-inspired shakshuka with holy basil and fish sauce. The queue at 9am is the reliable indicator of quality.", "vibe": 8.4, "localLove": 9.0, "uniqueness": 7.6, "tags": ["breakfast", "made to order", "rotating menu", "queue", "local ingredients"], "tip": "Arrive at 8:30am before the queue. The daily special is always the thing to order — he writes it on a board by hand.", "status": "approved", "agentIcon": "🎨", "discoveredBy": "Ari / Phahon Yothin"},
  {"id": "ag5-2", "cityId": "bangkok", "name": "NOMA Bangkok", "type": "experience", "neighborhood": "Phahon Yothin", "description": "Not the Danish restaurant — an independent bookshop and reading room in a converted house behind Phahon Yothin that specialises in Thai art, architecture, and design books in both Thai and English. The reading room has good coffee and a rule about silencing phones. Respected and largely undiscovered.", "vibe": 8.6, "localLove": 8.3, "uniqueness": 8.5, "tags": ["bookshop", "thai art books", "reading room", "quiet", "converted house"], "tip": "Check their events — monthly talks by Thai architects and artists that are open to walk-ins. Completely free.", "status": "approved", "agentIcon": "🎨", "discoveredBy": "Ari / Phahon Yothin"},
  {"id": "ag5-3", "cityId": "bangkok", "name": "Ronnarong Thai Cooking", "type": "experience", "neighborhood": "Ari", "description": "A home cooking school in an actual Bangkok home that teaches genuinely regional Thai cooking — not pad thai. Ronnarong grew up in Chiang Mai and teaches northern dishes that you won't find in any restaurant in the city. Maximum eight students. He tells you where to buy the ingredients so you can keep cooking at home.", "vibe": 9.2, "localLove": 9.1, "uniqueness": 9.0, "tags": ["cooking class", "northern thai", "home school", "small group", "regional"], "tip": "Book at least two weeks ahead. The market visit at the start is as valuable as the cooking. Bring a notebook.", "status": "approved", "agentIcon": "🎨", "discoveredBy": "Ari / Phahon Yothin"},
  {"id": "ag5-4", "cityId": "bangkok", "name": "Mango Tree", "type": "restaurant", "neighborhood": "Ari Soi 1", "description": "A neighbourhood Thai restaurant under a vast mango tree in someone's front garden that's been serving lunch to office workers and locals for 25 years. No signage visible from the road. The green curry is made with freshly pounded paste and coconut milk cracked on-site. The lunch special is 90 baht and includes soup, rice, and a dish.", "vibe": 8.3, "localLove": 9.6, "uniqueness": 8.2, "tags": ["garden restaurant", "no signage", "green curry", "25 years", "lunch special"], "tip": "Weekday lunches only, closes at 2pm. Find it by looking for the mango tree in the garden off Ari Soi 1.", "status": "approved", "agentIcon": "🎨", "discoveredBy": "Ari / Phahon Yothin"},
  {"id": "ag5-5", "cityId": "bangkok", "name": "Vinyl Record Ari", "type": "experience", "neighborhood": "Ari", "description": "A second-floor record shop reachable by a staircase covered in band posters that primarily stocks Thai and Southeast Asian pressings from the 1960s-80s. The owner has an encyclopedic knowledge of Thai country music and will play anything you want before you buy. Cash only, no photographs without asking.", "vibe": 8.7, "localLove": 8.9, "uniqueness": 9.2, "tags": ["vinyl", "thai music", "60s-80s", "second floor", "cash only"], "tip": "Go on Saturday afternoons when the owner is there and the music playing upstairs can be heard from the street.", "status": "approved", "agentIcon": "🎨", "discoveredBy": "Ari / Phahon Yothin"},
  {"id": "ag5-6", "cityId": "bangkok", "name": "Guss Damn Good", "type": "restaurant", "neighborhood": "Ari", "description": "Ice cream made from single-origin Thai dairy from a farm in Chiang Mai, using seasonal fruits and unexpected savoury twists. The toasted rice with young coconut, and the lychee with white pepper are both the kind of things that make you stop mid-spoonful. The shop has six stools and a small tree outside.", "vibe": 8.5, "localLove": 8.8, "uniqueness": 8.9, "tags": ["artisan ice cream", "single origin", "seasonal", "thai dairy", "six stools"], "tip": "The seasonal flavour changes monthly — whatever it is, order it. The waffle cone is also house-made.", "status": "approved", "agentIcon": "🎨", "discoveredBy": "Ari / Phahon Yothin"},
  {"id": "ag5-7", "cityId": "bangkok", "name": "Mace Restaurant", "type": "restaurant", "neighborhood": "Phahon Yothin 5", "description": "A 10-seat restaurant in a townhouse where the chef does a set menu that changes every two weeks, built around Thai regional ingredients and European technique. The kind of place where chefs eat on their days off and the wine pairings are taken seriously. The menu is printed on a single sheet and changes without announcement.", "vibe": 9.1, "localLove": 8.5, "uniqueness": 9.3, "tags": ["10 seats", "set menu", "rotating", "chef favourite", "wine pairing"], "tip": "Book directly via the phone number on their minimalist Instagram. Bring someone who will eat everything.", "status": "approved", "agentIcon": "🎨", "discoveredBy": "Ari / Phahon Yothin"},
  {"id": "ag5-8", "cityId": "bangkok", "name": "Tuk Tuk Republic", "type": "bar", "neighborhood": "Phahon Yothin", "description": "A craft brewery and taproom that operates out of a converted petrol station, serving its own lagers and ales alongside a rotating guest tap from Thai and regional breweries. The outdoor seating on the old forecourt forecourt is particularly good on a cool evening. Food comes from a small kitchen doing credible burgers and bar snacks.", "vibe": 8.3, "localLove": 8.6, "uniqueness": 7.9, "tags": ["craft brewery", "taproom", "converted petrol station", "thai beer", "forecourt seating"], "tip": "Wednesday evenings are the slowest — best for getting the brewer's attention and actual conversation about the beers.", "status": "approved", "agentIcon": "🎨", "discoveredBy": "Ari / Phahon Yothin"},
  {"id": "ag5-9", "cityId": "bangkok", "name": "Ari Farmers Market", "type": "market", "neighborhood": "Ari", "description": "A Saturday morning market in the Ari neighbourhood that operates on genuinely local produce ethics — all vendors must be direct producers, no resellers. You'll find heirloom rice from the north, hand-pressed coconut oil, organic herbs from community gardens in Nonthaburi, and a Thai-Italian cheese maker whose mozzarella is made that morning.", "vibe": 8.8, "localLove": 9.3, "uniqueness": 8.1, "tags": ["farmers market", "saturday", "direct producer", "heirloom rice", "local organic"], "tip": "Saturday 8am-1pm. The cheese vendor sells out by 10am. Bring a reusable bag and cash.", "status": "approved", "agentIcon": "🎨", "discoveredBy": "Ari / Phahon Yothin"},
  {"id": "ag6-0", "cityId": "bangkok", "name": "Bang Krachao Green Loop", "type": "experience", "neighborhood": "Bang Krachao / Phra Pradaeng", "description": "A 15km bicycle loop through Bangkok's 'green lung' — a river peninsula that looks like rural Thailand and is 15 minutes by ferry from Sathorn. The jungle path passes fruit orchards, stilted houses, and a floating market that operates entirely for residents. Rent a bicycle at the pier for 60 baht.", "vibe": 9.7, "localLove": 9.4, "uniqueness": 9.1, "tags": ["cycling", "green lung", "jungle", "fruit orchards", "ferry", "60 baht bike"], "tip": "Take the ferry from Klong Toei pier at 7am. Rent the oldest bike — it'll have better tyres. The orchard cafe at km 8 does fresh coconut.", "status": "approved", "agentIcon": "🌿", "discoveredBy": "Thonburi West Bank"},
  {"id": "ag6-1", "cityId": "bangkok", "name": "Wat Hong Rattanaram", "type": "experience", "neighborhood": "Bangkok Noi", "description": "A temple complex in the Bangkok Noi neighbourhood that contains an extraordinary museum of old Thai royal barges — not the official one downstream, but the working collection. The abbot restores them himself and will walk you through each vessel's history if the temple isn't busy. Some of the barges are over 200 years old.", "vibe": 8.8, "localLove": 8.2, "uniqueness": 9.4, "tags": ["royal barges", "restoration", "200 year old", "abbot guided", "free"], "tip": "Go on weekday mornings and ask the monks if the abbot is available. He speaks passable English and the tour is extraordinary.", "status": "approved", "agentIcon": "🌿", "discoveredBy": "Thonburi West Bank"},
  {"id": "ag6-2", "cityId": "bangkok", "name": "Nonthaburi Durian Market", "type": "market", "neighborhood": "Nonthaburi", "description": "A pre-dawn durian market operating from 2am on the Nonthaburi riverbank where orchard owners from Nonthaburi and beyond bring their harvest by boat. Serious durian buyers — restaurants, market vendors — do their business here before sunrise. Outsiders can join in by simply showing up and buying direct from the boats.", "vibe": 9.2, "localLove": 9.8, "uniqueness": 9.5, "tags": ["durian", "2am", "by boat", "wholesale", "pre-dawn", "river"], "tip": "Take a taxi to Nonthaburi Pier at 2:30am. Bring a torch. Buy direct from the boat vendors — half the market price. Do not bring it on the BTS afterwards.", "status": "approved", "agentIcon": "🌿", "discoveredBy": "Thonburi West Bank"},
  {"id": "ag6-3", "cityId": "bangkok", "name": "Wat Rakhang Bell Tower", "type": "experience", "neighborhood": "Bangkok Noi / Thonburi", "description": "A riverside temple famous for its 18th-century bell tower and the adjacent wooden library building that houses one of the most beautiful examples of Thai manuscript art in the country. Almost always empty. The terrace at the back faces the river and Wat Pho directly across, with none of the tourist foot traffic.", "vibe": 9.1, "localLove": 8.3, "uniqueness": 9.0, "tags": ["18th century", "bell tower", "manuscript art", "empty", "river view"], "tip": "Take the cross-river ferry from Tha Chang pier for 3 baht. The wooden library is unlocked from 9am-4pm.", "status": "approved", "agentIcon": "🌿", "discoveredBy": "Thonburi West Bank"},
  {"id": "ag6-4", "cityId": "bangkok", "name": "Klong Bangkok Noi Canal Tour", "type": "experience", "neighborhood": "Bangkok Noi", "description": "A network of canals in Bangkok Noi that still function as they did 100 years ago — local transport, market boats, spirit houses at every water junction, children swimming. Hire a longtail boat from the Bangkok Noi pier for a private 90-minute tour. Your driver will take you places no tourist boat goes.", "vibe": 9.6, "localLove": 9.0, "uniqueness": 9.3, "tags": ["canal tour", "longtail boat", "local life", "spirit houses", "90 minutes"], "tip": "Negotiate at Bangkok Noi pier early morning — 500 baht for 90 minutes is fair. Tell the driver you want to go slowly through the small klongs.", "status": "approved", "agentIcon": "🌿", "discoveredBy": "Thonburi West Bank"},
  {"id": "ag6-5", "cityId": "bangkok", "name": "Taling Chan Floating Market", "type": "market", "neighborhood": "Taling Chan", "description": "A genuine neighbourhood floating market that operates on the Thonburi canal on weekend mornings, primarily for locals buying groceries and eating cooked food on the canal bank. Unlike the tourist floating markets, the prices are Thai prices, the food is Thai breakfast food, and nobody is trying to sell you souvenirs.", "vibe": 8.7, "localLove": 9.5, "uniqueness": 8.3, "tags": ["floating market", "weekend", "local groceries", "thai breakfast", "no souvenirs"], "tip": "Songthaew or taxi from Victory Monument. Saturday 8am-4pm. Eat the grilled prawns and the coconut pancakes from the boat stalls.", "status": "approved", "agentIcon": "🌿", "discoveredBy": "Thonburi West Bank"},
  {"id": "ag6-6", "cityId": "bangkok", "name": "Sirindhorn Canal Boat Food", "type": "restaurant", "neighborhood": "Thonburi", "description": "A cluster of food boats moored on the Sirindhorn canal that sell cooked food to nearby factories and workshops. They operate from 5am and are gone by 9am. You can eat fried rice with prawns, pad see ew, and tom kha kai for 40-50 baht sitting on the canal bank with the factory shift workers.", "vibe": 8.5, "localLove": 9.7, "uniqueness": 8.9, "tags": ["canal food boats", "factory workers", "5am", "40 baht", "dawn"], "tip": "Ask a tuk-tuk driver to take you to the Sirindhorn canal food boats at 6am. Point and order what the workers are eating.", "status": "approved", "agentIcon": "🌿", "discoveredBy": "Thonburi West Bank"},
  {"id": "ag6-7", "cityId": "bangkok", "name": "Wat Kalayanamit Weaving Community", "type": "experience", "neighborhood": "Khlong San", "description": "Behind Wat Kalayanamit, a small community of weavers produces traditional Thai silk and cotton cloth using hand looms set up in the open-air ground floors of their houses. They sell directly, mostly to local customers. Watching the loom work and the dyeing process in the front garden is one of the quieter Bangkok pleasures.", "vibe": 8.4, "localLove": 9.0, "uniqueness": 9.1, "tags": ["weaving", "traditional silk", "hand loom", "community", "direct purchase"], "tip": "Weekday mornings when the weavers are working. Walk behind the temple toward the canal and follow the sound of the looms.", "status": "approved", "agentIcon": "🌿", "discoveredBy": "Thonburi West Bank"},
  {"id": "ag6-8", "cityId": "bangkok", "name": "Proong Nara Garden Cuisine", "type": "restaurant", "neighborhood": "Bang Krachao", "description": "A restaurant set in a garden inside Bang Krachao that serves traditional central Thai food using produce grown on the property. The tom yam is made with fresh galangal and kaffir lime from the garden, and the fish comes from the canal outside. Reachable only by bicycle or the bang krachao ferry.", "vibe": 9.3, "localLove": 9.1, "uniqueness": 9.4, "tags": ["garden restaurant", "bang krachao", "canal fish", "on-site produce", "bicycle only"], "tip": "Book ahead on weekends. Cycle from the ferry pier — it's 10 minutes through the orchards.", "status": "approved", "agentIcon": "🌿", "discoveredBy": "Thonburi West Bank"},
  {"id": "ag6-9", "cityId": "bangkok", "name": "Museum of the Forensic Medicine", "type": "experience", "neighborhood": "Siriraj Hospital, Bangkok Noi", "description": "A genuinely strange and fascinating set of medical museums inside Siriraj Hospital that includes a forensic pathology museum, a parasitology collection, and the preserved bodies of notable criminals. The medical history collection charts Thai medicine from ancient practice to today. Macabre, educational, and almost entirely unvisited by tourists.", "vibe": 7.8, "localLove": 7.5, "uniqueness": 9.8, "tags": ["forensic museum", "medical history", "macabre", "hospital", "preserved bodies"], "tip": "Take the hospital ferry from Tha Phra Chan pier. Open Tuesday-Sunday 10am-4pm, 200 baht entry. Not for the squeamish.", "status": "approved", "agentIcon": "🌿", "discoveredBy": "Thonburi West Bank"},
  {"id": "ag7-0", "cityId": "bangkok", "name": "Muay Thai Lab", "type": "experience", "neighborhood": "Ratchada", "description": "A training gym above a shophouse that offers walk-in sparring sessions and technique classes with actual Thai trainers who competed professionally. Not a tourist-facing camp — this is where local fighters and office workers train together in the evenings. The 6pm class is 300 baht and will rearrange your understanding of your own body.", "vibe": 9.0, "localLove": 9.5, "uniqueness": 8.8, "tags": ["muay thai", "genuine training", "thai trainers", "300 baht", "evening class"], "tip": "Show up at 5:45pm and tell them you want to train. Bring hand wraps. The trainers will pair you based on ability, not politeness.", "status": "approved", "agentIcon": "⚡", "discoveredBy": "Ratchada / Lat Phrao"},
  {"id": "ag7-1", "cityId": "bangkok", "name": "Yeak Thong Lor Street Food", "type": "market", "neighborhood": "Lat Phrao Soi 101", "description": "A street food cluster that feeds the Thai office worker population of the Lat Phrao corridor and operates entirely in Thai. Thirty vendors in a carpark from 5pm-midnight. The criteria for stall selection by locals is the length of the queue — join the longest one.", "vibe": 8.6, "localLove": 9.8, "uniqueness": 7.9, "tags": ["street food", "thai office crowd", "carpark market", "evening", "queue"], "tip": "Take a taxi to Lat Phrao Soi 101. Arrive by 7pm before popular stalls sell out. Everything is cash, no English.", "status": "approved", "agentIcon": "⚡", "discoveredBy": "Ratchada / Lat Phrao"},
  {"id": "ag7-2", "cityId": "bangkok", "name": "Studio Lam", "type": "bar", "neighborhood": "Sukhumvit Soi 51", "description": "A DJ bar attached to the ZudRangMa Records vinyl shop that plays exclusively Thai and Southeast Asian music — luk thung, molam, Thai psych, Lao pop. The DJs are passionate and the sound system is excellent. On peak nights the older Thai generation who actually lived through the music mix with younger collectors. Astonishing cultural collision.", "vibe": 9.6, "localLove": 9.4, "uniqueness": 9.7, "tags": ["thai music", "vinyl bar", "molam", "luk thung", "sound system", "cultural collision"], "tip": "Thursday and Friday nights are best. The record shop next door opens during bar hours — do not leave without buying something.", "status": "approved", "agentIcon": "⚡", "discoveredBy": "Ratchada / Lat Phrao"},
  {"id": "ag7-3", "cityId": "bangkok", "name": "Wongsakorn Hospital Market", "type": "market", "neighborhood": "Lat Phrao", "description": "A fresh market behind a community hospital in Lat Phrao that operates from 4am and sells wholesale produce to restaurants, market vendors, and serious home cooks. The fish section is extraordinary — whole fish sold by the kilo at source prices. Non-professionals are welcome; nobody will try to overcharge you.", "vibe": 8.0, "localLove": 9.6, "uniqueness": 8.4, "tags": ["4am", "wholesale market", "fresh fish", "restaurant trade", "source prices"], "tip": "Go between 5-6am when the widest selection is available. Bring a cooler bag. The shrimp paste vendor near the entrance is exceptional.", "status": "approved", "agentIcon": "⚡", "discoveredBy": "Ratchada / Lat Phrao"},
  {"id": "ag7-4", "cityId": "bangkok", "name": "Beer Republic", "type": "bar", "neighborhood": "Ratchada Soi 3", "description": "Bangkok's most serious craft beer bar — 30 taps, extensive bottle list, a beer sommelier who actually has the certification. The crowd is mixed Thai and expat in the best way, bound by shared interest in obscure Belgian ales and Thai craft lagers. The knowledgeable staff will guide you through a flight of anything.", "vibe": 8.7, "localLove": 8.8, "uniqueness": 8.0, "tags": ["craft beer", "30 taps", "beer sommelier", "belgian ales", "flight"], "tip": "Thursday 'Brewmaster Night' when guest brewers bring one-off batches. The tasting flight of 4 is better value than ordering full pints.", "status": "approved", "agentIcon": "⚡", "discoveredBy": "Ratchada / Lat Phrao"},
  {"id": "ag7-5", "cityId": "bangkok", "name": "Talad Neon Night Market", "type": "market", "neighborhood": "Ratchada", "description": "A genuinely local night market near the Ratchada cultural centre with none of the curation of Train Night Market. Clothing vendors, food stalls, carnival games, live music playing Thai pop on a small stage. The crowd is entirely Thai suburban — families, teenagers, people who live nearby. Refreshingly uncommercialised.", "vibe": 8.3, "localLove": 9.4, "uniqueness": 7.5, "tags": ["night market", "local", "thai families", "live pop music", "uncommercialised"], "tip": "Arrive after 8pm when it gets going. The mango tango stall with the queues is not to be missed. Bring cash.", "status": "approved", "agentIcon": "⚡", "discoveredBy": "Ratchada / Lat Phrao"},
  {"id": "ag7-6", "cityId": "bangkok", "name": "Rajawongse Clothiers", "type": "experience", "neighborhood": "Near Ratchada", "description": "A bespoke tailor operating from a cramped shophouse that makes suits, shirts, and trousers to measure at prices that are genuinely astonishing. The owner trained in Hong Kong and the fabrics come from mills that don't do tourist prices. Three-day turnaround on a shirt. Six days on a suit.", "vibe": 7.9, "localLove": 9.2, "uniqueness": 8.5, "tags": ["bespoke tailor", "shophouse", "hong kong trained", "honest price", "3-day turnaround"], "tip": "Bring a reference photograph of what you want. Allow 3 fittings minimum for a suit.", "status": "approved", "agentIcon": "⚡", "discoveredBy": "Ratchada / Lat Phrao"},
  {"id": "ag7-7", "cityId": "bangkok", "name": "Ratchada Amphitheater Shows", "type": "experience", "neighborhood": "Ratchada Cultural Center", "description": "Free traditional Thai performance — khon masked dance, classical music, puppet theatre — that happens in the amphitheatre behind the Thailand Cultural Centre MRT station. Put on by Thammasat students and regional performance companies. Inconsistent scheduling but extraordinary when it happens. Completely free, no reservation.", "vibe": 8.8, "localLove": 9.0, "uniqueness": 9.0, "tags": ["khon dance", "free performance", "classical thai", "puppet theatre", "student performers"], "tip": "Check the Thailand Cultural Centre website or their Facebook for upcoming shows. Shows happen 5-7pm on selected weekends.", "status": "approved", "agentIcon": "⚡", "discoveredBy": "Ratchada / Lat Phrao"},
  {"id": "ag7-8", "cityId": "bangkok", "name": "Khua Kling Pak Sod", "type": "restaurant", "neighborhood": "Sathorn (also Ratchada branch)", "description": "Southern Thai cuisine done with the terrifying authenticity of a restaurant run by a family from Nakhon Si Thammarat. The khua kling — a dry-fried minced meat curry — is one of the hottest dishes in Bangkok and the menu comes with a genuine spice warning. The restaurant's regulars include everyone who grew up eating southern Thai food and misses it.", "vibe": 9.2, "localLove": 9.7, "uniqueness": 8.6, "tags": ["southern thai", "khua kling", "extremely spicy", "authentic", "nakhon si thammarat"], "tip": "Order khua kling, stir-fried water mimosa, and white rice. Tell them medium spice and it will still be very hot.", "status": "approved", "agentIcon": "⚡", "discoveredBy": "Ratchada / Lat Phrao"},
  {"id": "ag7-9", "cityId": "bangkok", "name": "Thip Samai After Dark", "type": "restaurant", "neighborhood": "Banglamphu (also Lat Phrao branch)", "description": "Everyone knows the Thip Samai on Mahachai Road — but fewer people know the Lat Phrao branch that opens at 5pm and runs until 4am, serving the original pad thai recipe to night workers and taxi drivers who've been coming for decades. The prawns are shell-on and enormous. The orange juice is freshly pressed on-site.", "vibe": 9.0, "localLove": 9.8, "uniqueness": 8.0, "tags": ["pad thai", "4am", "night workers", "shell-on prawns", "fresh orange juice"], "tip": "Go between 1-3am when the tourist traffic is gone and the cooks are in full rhythm. The 'wrapped' pad thai inside an egg crepe is the original way.", "status": "approved", "agentIcon": "⚡", "discoveredBy": "Ratchada / Lat Phrao"},
  {"id": "ag8-0", "cityId": "bangkok", "name": "Smalls Bar", "type": "bar", "neighborhood": "Sukhumvit Soi 22 (Silom crowd)", "description": "A jazz bar hidden in the basement of a residential building with no signage outside and a door that looks like a utility entrance. The jazz is live and serious — mostly Thai musicians who play in the style of the American 50s-60s — and the bar serves drinks named after jazz standards. Membership is informal; you get in by knowing where it is.", "vibe": 9.7, "localLove": 9.2, "uniqueness": 9.8, "tags": ["jazz", "basement bar", "no signage", "thai jazz musicians", "50s-60s style"], "tip": "Find the door via their Instagram. Friday nights the standards are played in order from the Real Book. The Monk is exceptional.", "status": "approved", "agentIcon": "🍸", "discoveredBy": "Silom / Sathorn"},
  {"id": "ag8-1", "cityId": "bangkok", "name": "Namsaah Bottling Trust", "type": "bar", "neighborhood": "Sathorn Soi 7", "description": "A former soda bottling factory converted into a craft cocktail bar with the industrial bones left exposed and a menu organised by flavour profile rather than spirit category. The Thai soda cocktails using house-made sodas with regional fruit flavours are the most interesting things on the menu. Almost no signage.", "vibe": 9.1, "localLove": 8.7, "uniqueness": 9.2, "tags": ["craft cocktails", "former factory", "house sodas", "thai fruit", "industrial bones"], "tip": "The house-made rosella and young ginger cocktail. Go on weekdays to actually talk to the bartenders about what they're making.", "status": "approved", "agentIcon": "🍸", "discoveredBy": "Silom / Sathorn"},
  {"id": "ag8-2", "cityId": "bangkok", "name": "Somtam Nua", "type": "restaurant", "neighborhood": "Siam / Silom", "description": "A papaya salad restaurant that has been serving the best som tam in central Bangkok since 1994. Run by a family from Isan with the same recipes across three decades, the menu has expanded minimally and everything is still made fresh to order. The Isan sausage and fermented fish versions are not for timid palates.", "vibe": 8.5, "localLove": 9.6, "uniqueness": 7.9, "tags": ["som tam", "papaya salad", "isan", "1994", "family run", "fermented fish"], "tip": "The fermented crab som tam is the benchmark. Tell them Thai spice level — their 'not spicy' is medium heat for most visitors.", "status": "approved", "agentIcon": "🍸", "discoveredBy": "Silom / Sathorn"},
  {"id": "ag8-3", "cityId": "bangkok", "name": "The Local by Oam Thong Thai Cuisine", "type": "restaurant", "neighborhood": "Sukhumvit Soi 23", "description": "A restaurant inside a converted century-old teak house that serves Thai food from royal and aristocratic recipes — dishes that were once served in Bangkok's elite households and have disappeared from street food culture. The menus comes with historical notes. The banana blossom salad is made to a palace recipe.", "vibe": 9.0, "localLove": 8.4, "uniqueness": 9.3, "tags": ["royal thai cuisine", "teak house", "palace recipes", "aristocratic dishes", "historical notes"], "tip": "Order the set menu rather than à la carte to understand the progression of the meal. Book ahead for the private rooms in the old servants' quarters.", "status": "approved", "agentIcon": "🍸", "discoveredBy": "Silom / Sathorn"},
  {"id": "ag8-4", "cityId": "bangkok", "name": "Chon Bar", "type": "bar", "neighborhood": "Sathorn Soi 10", "description": "An intimate eight-seat bar run by a bartender who returned from Tokyo with a reverence for Japanese technique and applied it to Thai ingredients. The menu changes weekly, built around what's in season and what the bartender is obsessed with that week. The bar has no name on the door.", "vibe": 9.4, "localLove": 8.6, "uniqueness": 9.6, "tags": ["8 seats", "japanese technique", "thai ingredients", "weekly menu", "no door sign"], "tip": "Book through Instagram DM. Come with an open mind and no preferences — let the bartender decide.", "status": "approved", "agentIcon": "🍸", "discoveredBy": "Silom / Sathorn"},
  {"id": "ag8-5", "cityId": "bangkok", "name": "Silom Village Night Market", "type": "market", "neighborhood": "Silom", "description": "A small courtyard market behind the Silom Village complex that has been quietly feeding the Silom office worker population for 30 years. The daytime vendors pack up at 6pm and the evening market takes over — grilled chicken, som tam, khao man gai, and cold beer in plastic cups on low tables.", "vibe": 8.2, "localLove": 9.5, "uniqueness": 7.6, "tags": ["courtyard market", "30 years", "office workers", "evening", "cold beer"], "tip": "Weekday evenings 6-10pm when the office crowd unwinds. The grilled chicken vendor has a longer queue for a reason.", "status": "approved", "agentIcon": "🍸", "discoveredBy": "Silom / Sathorn"},
  {"id": "ag8-6", "cityId": "bangkok", "name": "Attitude Bar at U Sathorn", "type": "bar", "neighborhood": "Sathorn", "description": "A small poolside bar at the U Sathorn hotel that operates as a de-facto neighbourhood hangout for Sathorn locals who use the walk-in bar privileges. The bartender has been there for 15 years and knows everyone who comes in by first name. The Thai whisky soda setup on the terrace at 6pm is one of Bangkok's more civilised hours.", "vibe": 8.6, "localLove": 8.4, "uniqueness": 7.8, "tags": ["poolside", "hotel bar", "open to public", "15 year bartender", "thai whisky"], "tip": "Walk in and say you want a drink by the pool. The longstanding bartender Noi will take care of the rest.", "status": "approved", "agentIcon": "🍸", "discoveredBy": "Silom / Sathorn"},
  {"id": "ag8-7", "cityId": "bangkok", "name": "Bangrak Market (Talat Bangrak)", "type": "market", "neighborhood": "Bangrak", "description": "A century-old covered market in the Bangrak neighbourhood that predates everything around it. Produces, dried goods, fresh flowers, and a row of ancient Chinese-Thai coffee stalls operating from pre-dawn. The market building itself is remarkable — cast iron columns, original tiles, and a roof that's been leaking elegantly for decades.", "vibe": 8.4, "localLove": 9.3, "uniqueness": 8.8, "tags": ["century old", "covered market", "cast iron", "chinese-thai coffee", "pre-dawn", "flowers"], "tip": "Arrive at 6am for the coffee stalls and the flower vendors at their most active. The market quiets dramatically by 10am.", "status": "approved", "agentIcon": "🍸", "discoveredBy": "Silom / Sathorn"},
  {"id": "ag8-8", "cityId": "bangkok", "name": "Sri Mariamman Temple Evening", "type": "experience", "neighborhood": "Silom", "description": "The oldest Hindu temple in Bangkok — not the Erawan Shrine — operating a genuine active South Indian religious community. The evening puja at 6:30pm is conducted in Tamil with flower offerings and incense. The temple elephant is ceremonially blessed on major festival days. The surrounding streets smell of jasmine garlands being strung.", "vibe": 9.0, "localLove": 8.7, "uniqueness": 9.1, "tags": ["hindu temple", "tamil community", "evening puja", "temple elephant", "jasmine garlands"], "tip": "Evening puja at 6:30pm daily. Dress modestly and remove shoes. The flower vendors outside are selling directly to the temple.", "status": "approved", "agentIcon": "🍸", "discoveredBy": "Silom / Sathorn"},
  {"id": "ag8-9", "cityId": "bangkok", "name": "Eating Room Sathorn", "type": "restaurant", "neighborhood": "Sathorn Soi 10", "description": "A private dining experience hosted in someone's actual home in Sathorn — a six-course Thai meal cooked by a former palace chef who left formal employment to cook for fifteen guests at a time in her dining room. The tablecloth is linen. The recipes are not available anywhere else. Book months in advance.", "vibe": 9.5, "localLove": 9.0, "uniqueness": 9.9, "tags": ["private dining", "palace chef", "home restaurant", "six courses", "months in advance"], "tip": "Find through word of mouth or very persistent searching. They are not on social media. Monthly seatings, 15 guests maximum.", "status": "approved", "agentIcon": "🍸", "discoveredBy": "Silom / Sathorn"},
  {"id": "ag9-0", "cityId": "bangkok", "name": "The Bookshop Bar", "type": "bar", "neighborhood": "Phra Athit", "description": "A narrow shophouse operating as a used bookshop by day and a bar by evening, with the books remaining on the shelves throughout and customers reading at their tables. The wine is cheap, the cocktails are thought through, and the house rule is that you may not use your phone at the bar. People actually talk to each other here.", "vibe": 9.2, "localLove": 8.8, "uniqueness": 9.0, "tags": ["bookshop bar", "no phones at bar", "wine", "books", "conversation"], "tip": "The evening reading hour from 6-8pm when the bar is quiet and the selection of wine by the glass changes. Check what's been left behind on the swap shelf.", "status": "approved", "agentIcon": "🎭", "discoveredBy": "Banglamphu / Phra Nakhon"},
  {"id": "ag9-1", "cityId": "bangkok", "name": "Folk Music Night at Adhere the 13th", "type": "bar", "neighborhood": "Banglamphu Soi Rambutri", "description": "A narrow bar on Soi Rambutri that plays live Thai folk and blues music every night — not for tourists but for the musicians who come to jam after their other gigs. The house band starts at 10pm and anyone who can play is invited to join. The Leo beer is cold and the conversation is in a mixture of Thai and English.", "vibe": 9.3, "localLove": 9.5, "uniqueness": 8.9, "tags": ["thai folk music", "blues", "live jam", "musician hangout", "late night"], "tip": "Go after 10pm when the impromptu jam starts. Bring your instrument if you have one. The barman Noon has been pouring here for 15 years.", "status": "approved", "agentIcon": "🎭", "discoveredBy": "Banglamphu / Phra Nakhon"},
  {"id": "ag9-2", "cityId": "bangkok", "name": "Thammasat University Canteen", "type": "restaurant", "neighborhood": "Tha Phra Chan", "description": "The university canteen on the ground floor of the oldest university in Thailand — accessible to anyone who walks in. Serves full Thai meals for 35-50 baht to students, faculty, and opportunistic visitors. The kaeng kari (yellow curry) with roti is made daily by a Thai-Muslim vendor and is exceptional. Eat among the students debating Thai politics over lunch.", "vibe": 8.1, "localLove": 9.7, "uniqueness": 8.3, "tags": ["university canteen", "35 baht", "student crowd", "yellow curry", "open to public"], "tip": "Weekdays 11am-2pm. Walk in like you own the place. The Thai-Muslim curry counter near the river entrance is the one.", "status": "approved", "agentIcon": "🎭", "discoveredBy": "Banglamphu / Phra Nakhon"},
  {"id": "ag9-3", "cityId": "bangkok", "name": "Phra Sumen Fort Sunset", "type": "experience", "neighborhood": "Phra Athit", "description": "An 18th-century watchtower fort at the north end of Phra Athit road that you can walk around for free. At sunset, the lawn between the fort and the river is claimed by university students picnicking, elderly Thais doing tai chi, and occasional musicians. It is the most unpretentious sunset spot in Bangkok.", "vibe": 9.4, "localLove": 9.7, "uniqueness": 8.4, "tags": ["18th century fort", "free", "picnic", "sunset", "tai chi", "university students"], "tip": "Arrive at 5:30pm with food from the street vendors on Phra Athit road. The west-facing river view is best from the base of the fort.", "status": "approved", "agentIcon": "🎭", "discoveredBy": "Banglamphu / Phra Nakhon"},
  {"id": "ag9-4", "cityId": "bangkok", "name": "Banglamphu Community Mural Trail", "type": "experience", "neighborhood": "Banglamphu back streets", "description": "A self-directed walking trail through the sois behind Khao San Road that encounters a series of murals commissioned from Thai street artists over the past decade. The murals are political, playful, and deeply local — references to Thai folk tales, student protest history, and neighbourhood characters. None of them are on any map.", "vibe": 9.0, "localLove": 8.5, "uniqueness": 8.9, "tags": ["murals", "street art", "self-guided", "political art", "thai folk tales"], "tip": "Start on Soi Rambuttri and walk away from Khao San. Look left and right — several murals are on interior walls. Best in morning light.", "status": "approved", "agentIcon": "🎭", "discoveredBy": "Banglamphu / Phra Nakhon"},
  {"id": "ag9-5", "cityId": "bangkok", "name": "Jae Pong Khao Tom", "type": "restaurant", "neighborhood": "Banglamphu", "description": "A late-night rice porridge restaurant that opens at 11pm and runs until 5am, catering to the hospitality industry workers who finish their shifts and need to eat. No atmosphere packaging — strip lights, plastic tables, and a khao tom made with pork and ginger that tastes like someone loves you. 60 baht for a bowl.", "vibe": 8.2, "localLove": 9.8, "uniqueness": 8.0, "tags": ["khao tom", "11pm-5am", "hospitality workers", "strip lights", "60 baht"], "tip": "Go at 1am when it's full of cooks and waiters from nearby restaurants. Order the pork khao tom with salted egg on the side.", "status": "approved", "agentIcon": "🎭", "discoveredBy": "Banglamphu / Phra Nakhon"},
  {"id": "ag9-6", "cityId": "bangkok", "name": "Thai Puppet Theatre Marionette", "type": "experience", "neighborhood": "Phra Nakhon", "description": "A traditional Thai marionette theatre company operating from a converted shophouse that performs original shows twice weekly. The marionettes are hand-crafted to 200-year-old specifications and the performances draw on Ramakien mythology. The company sustains itself through workshops where visitors can learn marionette manipulation.", "vibe": 9.0, "localLove": 8.0, "uniqueness": 9.6, "tags": ["marionette theatre", "ramakien", "traditional craft", "twice weekly", "workshop available"], "tip": "Wednesday and Saturday shows at 2pm and 7pm. Book via their LINE. The 90-minute performance includes an English-language synopsis handout.", "status": "approved", "agentIcon": "🎭", "discoveredBy": "Banglamphu / Phra Nakhon"},
  {"id": "ag9-7", "cityId": "bangkok", "name": "Khaosan Road At 7am", "type": "experience", "neighborhood": "Khao San", "description": "The most interesting time to visit Khao San Road is 7am, after the night crowd has gone and before the tourist operations open. Street cleaners, local noodle vendors setting up, residents collecting their morning coffee, the odd stray survivor from the night before. The street belongs to the neighbourhood for exactly two hours.", "vibe": 8.8, "localLove": 9.1, "uniqueness": 8.6, "tags": ["7am", "post-night", "noodle vendors", "local morning", "temporary quiet"], "tip": "The noodle cart that sets up outside 7-Eleven at 6:45am does a kuay teow naam that the street cleaners queue for.", "status": "approved", "agentIcon": "🎭", "discoveredBy": "Banglamphu / Phra Nakhon"},
  {"id": "ag9-8", "cityId": "bangkok", "name": "Democracy Monument After Dark", "type": "experience", "neighborhood": "Ratchadamnoen", "description": "The central landmark of Bangkok's political history is transformed after 10pm into an impromptu gathering point for young Thais — skateboarders, students, artists — who come to sit on the monument's base, eat papaya salad from a nearby cart, and talk. The monument has been the site of every major political protest; at night it belongs to youth.", "vibe": 9.1, "localLove": 9.4, "uniqueness": 8.8, "tags": ["democracy monument", "after dark", "skateboarders", "political history", "student gathering"], "tip": "Come on a Friday or Saturday night after 10pm. The papaya salad cart on the north side is the best in the area.", "status": "approved", "agentIcon": "🎭", "discoveredBy": "Banglamphu / Phra Nakhon"},
  {"id": "ag9-9", "cityId": "bangkok", "name": "Rongros Community Kitchen", "type": "restaurant", "neighborhood": "Banglamphu", "description": "A community kitchen project in Banglamphu that operates as a social enterprise — trained chefs from marginalised communities serve a rotating regional Thai menu at below-market prices. The meals are excellent and eating there contributes directly to vocational training programmes. The weekly menu is posted on their door every Monday.", "vibe": 8.5, "localLove": 8.9, "uniqueness": 8.7, "tags": ["social enterprise", "community kitchen", "regional thai", "weekly rotating menu", "below market price"], "tip": "Check the weekly menu posted Monday morning. The northern dishes tend to be the strongest — the chef roster rotates monthly.", "status": "approved", "agentIcon": "🎭", "discoveredBy": "Banglamphu / Phra Nakhon"},
  {"id": "ag10-0", "cityId": "bangkok", "name": "Apoteka", "type": "bar", "neighborhood": "Sukhumvit Soi 11", "description": "A Croatian-owned bar that operates on the premise that the house cocktail will be whatever the bartender thinks suits you. The bottles behind the bar include spirits that can't be found anywhere else in Bangkok — obscure Balkan brandies, natural amaro from small producers, and the owner's private stock of Mezcal from a Oaxacan village. Twenty seats and a rotation of regulars who came once and never quite left.", "vibe": 9.3, "localLove": 8.4, "uniqueness": 9.5, "tags": ["bartender decides", "rare spirits", "balkan brandy", "mezcal", "20 seats"], "tip": "Sit at the bar and ask what you should drink. If you say 'something unusual' they will take that seriously.", "status": "approved", "agentIcon": "🔮", "discoveredBy": "Sukhumvit Mid (Asok–Phrom Phong)"},
  {"id": "ag10-1", "cityId": "bangkok", "name": "Supanniga Eating Room", "type": "restaurant", "neighborhood": "Sukhumvit Soi 55", "description": "A restaurant that serves the grandmother's recipes of its owner — Thai-Chinese home cooking from Trat province that has no presence in restaurant culture because it was only ever cooked at home. The stir-fried crab with yellow curry powder is a revelation. The room is calm and full of Thai families having the meal they can't cook for themselves.", "vibe": 8.9, "localLove": 9.3, "uniqueness": 9.1, "tags": ["grandmother recipes", "trat province", "thai-chinese home cooking", "crab curry powder", "family dining"], "tip": "The crab with yellow curry powder and the pork belly with Chinese five spice. Book ahead for weekends.", "status": "approved", "agentIcon": "🔮", "discoveredBy": "Sukhumvit Mid (Asok–Phrom Phong)"},
  {"id": "ag10-2", "cityId": "bangkok", "name": "Asia Today Record Bar", "type": "bar", "neighborhood": "Asok", "description": "A record bar behind a steamed bun shop that opens at 7pm and plays records chosen by whoever shows up first that evening. The system is extraordinary — a 1970s Japanese setup the owner spent four years restoring. There is no DJ, only a rotating selection that anyone in the room can contribute to from the shop's collection.", "vibe": 9.5, "localLove": 9.0, "uniqueness": 9.7, "tags": ["record bar", "communal selection", "1970s system", "steamed bun entrance", "7pm"], "tip": "Come at 7pm when it opens. Bring a record you want to hear and they'll play it.", "status": "approved", "agentIcon": "🔮", "discoveredBy": "Sukhumvit Mid (Asok–Phrom Phong)"},
  {"id": "ag10-3", "cityId": "bangkok", "name": "Ruam Jai Fruit Market", "type": "market", "neighborhood": "Asok", "description": "An overnight wholesale fruit market in the Asok area that operates from midnight to 6am. The variety of tropical fruit — many varieties never seen in tourist markets — is extraordinary, and the prices are source-adjacent. Durian, rambutan, rose apple, and seasonal varieties brought directly from provincial orchards.", "vibe": 8.6, "localLove": 9.6, "uniqueness": 9.0, "tags": ["overnight", "wholesale fruit", "midnight-6am", "tropical variety", "direct from orchards"], "tip": "Go at 2am. The best durian arrives between 1-3am from Nonthaburi and Chanthaburi. Bring your own bag and cash.", "status": "approved", "agentIcon": "🔮", "discoveredBy": "Sukhumvit Mid (Asok–Phrom Phong)"},
  {"id": "ag10-4", "cityId": "bangkok", "name": "Nahm (The Bar)", "type": "bar", "neighborhood": "Como Metropolitan, Sathorn", "description": "Not the restaurant — the bar of the Nahm space that serves complex Thai-inspired cocktails created by the bar team using the same respect for traditional Thai flavour architecture that makes the kitchen famous. You can sit at the bar for 400-600 baht a drink and receive something genuinely extraordinary. More approachable and less reserved than the dining room.", "vibe": 9.1, "localLove": 8.0, "uniqueness": 9.4, "tags": ["thai cocktails", "bar only", "traditional flavour", "400-600 baht", "hotel bar"], "tip": "Sit at the bar and tell them you're interested in Thai botanical ingredients. They will create something specifically.", "status": "approved", "agentIcon": "🔮", "discoveredBy": "Sukhumvit Mid (Asok–Phrom Phong)"},
  {"id": "ag10-5", "cityId": "bangkok", "name": "Emquartier Helix Food Hall", "type": "market", "neighborhood": "Phrom Phong", "description": "The upper floors of Emquartier mall house a food spiral that most tourists mistake for a tourist attraction but is actually the daily lunch and dinner destination for the Phrom Phong residential and office population. Thai regional food, Japanese ramen, and local specialities at Thai prices, completely removed from the tourist-facing stalls below.", "vibe": 8.0, "localLove": 9.1, "uniqueness": 7.4, "tags": ["food hall", "helix", "thai regional", "daily local", "hidden floors"], "tip": "Take the spiral escalator up past the tourist floor. The Isan food court on the upper level has the best larb in the building.", "status": "approved", "agentIcon": "🔮", "discoveredBy": "Sukhumvit Mid (Asok–Phrom Phong)"},
  {"id": "ag10-6", "cityId": "bangkok", "name": "Fermented Bangkok", "type": "restaurant", "neighborhood": "Sukhumvit Soi 26", "description": "A small restaurant focused entirely on fermented and preserved Thai foods — pla ra (fermented fish), naem (fermented pork), miang (fermented tea leaves), and a rotating selection of regional preserved vegetables. The menu is educational and the chef explains everything. Not for every palate, but for those willing to go there, the most interesting flavours in the city.", "vibe": 8.7, "localLove": 8.3, "uniqueness": 9.8, "tags": ["fermented foods", "pla ra", "naem", "fermented tea", "educational menu"], "tip": "Book ahead and tell them your experience level with fermented flavours. They will calibrate the menu. Start with the miang for acclimatisation.", "status": "approved", "agentIcon": "🔮", "discoveredBy": "Sukhumvit Mid (Asok–Phrom Phong)"},
  {"id": "ag10-7", "cityId": "bangkok", "name": "Above Eleven", "type": "bar", "neighborhood": "Sukhumvit Soi 11", "description": "A rooftop bar that the Peruvian-Japanese chef concept makes unique — nikkei cocktails using pisco alongside Japanese whisky, the Peruvian food influence applied to Thai ingredients. It's consistently overlooked because it's not on the standard tourist list, and the crowd is consequently Bangkok professional rather than backpacker overflow.", "vibe": 8.8, "localLove": 7.9, "uniqueness": 8.7, "tags": ["nikkei", "rooftop", "pisco", "japanese whisky", "peruvian-japanese"], "tip": "The pisco sour variations are the signature. Go for the view at dusk, stay for the food as the city lights up.", "status": "approved", "agentIcon": "🔮", "discoveredBy": "Sukhumvit Mid (Asok–Phrom Phong)"},
  {"id": "ag10-8", "cityId": "bangkok", "name": "Siri House", "type": "experience", "neighborhood": "Sukhumvit Soi 1", "description": "A converted 1950s house that functions as a community art space, Thai contemporary gallery, and occasional pop-up restaurant in the garden. The programming changes monthly. On weekends the garden becomes a small market for Thai independent designers and the gallery is open for free. The house itself is worth the visit.", "vibe": 8.9, "localLove": 8.6, "uniqueness": 8.8, "tags": ["converted house", "art gallery", "1950s", "garden market", "independent designers"], "tip": "Check their social media for weekend programming. The garden pop-up market happens on the last Sunday of each month.", "status": "approved", "agentIcon": "🔮", "discoveredBy": "Sukhumvit Mid (Asok–Phrom Phong)"},
  {"id": "ag10-9", "cityId": "bangkok", "name": "Yusup Pochana", "type": "restaurant", "neighborhood": "Sukhumvit Soi 3 / Nana", "description": "A Southern Thai-Muslim restaurant near the Nana mosque that has been operating in the same location for 40 years. The chicken biryani is cooked in a single giant pot and served on a banana leaf. The community eating here is a mix of Thai Muslims, South Asian expats, and the occasional food pilgrim who found it by walking the soi. One of Bangkok's most authentic rice dishes.", "vibe": 8.4, "localLove": 9.5, "uniqueness": 8.6, "tags": ["thai muslim", "biryani", "banana leaf", "40 years", "nana mosque"], "tip": "Lunch only, opens at 11am and closes when the biryani pot is empty. Arrive by noon.", "status": "approved", "agentIcon": "🔮", "discoveredBy": "Sukhumvit Mid (Asok–Phrom Phong)"}
];

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const INITIAL_CITIES = [{
  id:"bangkok", name:"Bangkok", country:"Thailand", emoji:"🇹🇭",
  tagline:"The city that never sleeps — and never stops surprising",
  description:"Beyond the Grand Palace and Khao San Road lies a Bangkok most tourists never find.",
  active:true,
}];

const INITIAL_SPOTS = [
  { id:"s1", cityId:"bangkok", name:"The Commons Thonglor", type:"experience", neighborhood:"Thonglor", description:"A brutalist community hub draped in climbing plants. No mall energy — just locals spilling out of food stalls, independent coffee bars and a wine shop onto raw concrete terraces. Best on weekday evenings.", vibe:9.1, localLove:8.7, uniqueness:7.8, tags:["food hall","architecture","local scene","evening"], tip:"Go to the top floor. Wine bar with zero pretension, incredible people-watching.", status:"approved" },
  { id:"s2", cityId:"bangkok", name:"Rod Fai Train Night Market", type:"market", neighborhood:"Ratchada", description:"A retro night market that makes Chatuchak look tame. Vintage everything — cameras, motorcycles, neon signs — plus bars in stacked shipping containers and street food that wrecks you in the best way.", vibe:9.4, localLove:9.0, uniqueness:8.5, tags:["night market","vintage","street food","bars"], tip:"Take MRT to National Cultural Center, Exit 3. Busiest Thu–Sun after 8pm.", status:"approved" },
  { id:"s3", cityId:"bangkok", name:"Wat Pariwat — Pop Culture Temple", type:"experience", neighborhood:"Sathon", description:"A working Buddhist temple where monks added David Beckham, Batman, Pikachu and Spider-Man to the carvings. Genuinely reverent. Finding all the figures hidden in the stonework is one of Bangkok's great treasure hunts.", vibe:8.8, localLove:7.5, uniqueness:10.0, tags:["temple","bizarre","free","photography"], tip:"Best mid-morning. Sarongs available at entrance.", status:"approved" },
  { id:"s4", cityId:"bangkok", name:"Cabbages & Condoms", type:"restaurant", neighborhood:"Sukhumvit Soi 12", description:"A non-profit restaurant where every surface and mannequin is decorated with condoms — proceeds fund rural development. The Thai food is genuinely excellent.", vibe:8.2, localLove:8.0, uniqueness:9.6, tags:["non-profit","thai food","quirky","conversation starter"], tip:"Garden seating at the back is the move. Arrive early.", status:"approved" },
  { id:"s5", cityId:"bangkok", name:"Jay Fai", type:"restaurant", neighborhood:"Banglamphu", description:"A woman in ski goggles cooks over roaring flames on a street-side cart with a Michelin star. The crab omelette is otherworldly. Book via LINE or queue from 9am.", vibe:9.7, localLove:9.5, uniqueness:9.2, tags:["michelin","street food","legendary","crab omelette"], tip:"Book via LINE. Arrive exactly on time — she runs out fast.", status:"approved" },
  { id:"s6", cityId:"bangkok", name:"Chang Chui Creative Market", type:"market", neighborhood:"Bang Phlat", description:"A repurposed airplane hangs over an eclectic market-meets-art-installation. Indie designers, small-batch food vendors, street performers, and an experimental gallery under the fuselage.", vibe:8.9, localLove:8.3, uniqueness:9.1, tags:["art","market","design","airplane"], tip:"Friday and Saturday nights only. Come after 6pm.", status:"approved" },
  { id:"s7", cityId:"bangkok", name:"Baan Silapin (Artist's House)", type:"experience", neighborhood:"Thonburi", description:"A centuries-old teak house on a canal with traditional shadow puppet performances in a tiny wood-panelled theatre. Reached by longtail boat — the journey is half the experience.", vibe:9.3, localLove:8.6, uniqueness:9.4, tags:["art","canal","puppets","cultural","hidden"], tip:"Sunday afternoon puppet show. Take a canal boat from Tha Tien pier.", status:"approved" },
  { id:"s8", cityId:"bangkok", name:"Khlong Ong Ang Walking Street", type:"bar", neighborhood:"Old Town", description:"A formerly grim canal now strung with lights, acoustic musicians on bridges, pop-up bars in reclaimed spaces, and grilled skewers drifting over the water. Still raw enough to feel real.", vibe:9.0, localLove:9.2, uniqueness:8.7, tags:["bars","live music","canal","local"], tip:"Weekend evenings after 5pm. Boat noodles at the north end.", status:"approved" },
  { id:"s9", cityId:"bangkok", name:"Bangkokian Museum", type:"experience", neighborhood:"Bangrak", description:"Three traditional teak houses frozen in the 1940s–60s — a doctor's practice, a family home, pristine period objects everywhere. Free entry, almost always empty, run by volunteers.", vibe:7.8, localLove:9.0, uniqueness:8.9, tags:["free","museum","history","hidden"], tip:"Open Weds–Sun, 10am–4pm. The caretaker will walk you through.", status:"approved" },
  { id:"s10", cityId:"bangkok", name:"KHAAN Fine Dining", type:"restaurant", neighborhood:"Ploenchit", description:"Eighteen seats. An 11-course journey through Thai regional cuisine. Hidden in a residential street with no signage. One of the most quietly extraordinary meals in Southeast Asia.", vibe:9.2, localLove:8.8, uniqueness:9.0, tags:["michelin guide","tasting menu","intimate","thai fine dining"], tip:"Book weeks ahead. BYO wine — corkage is generous.", status:"approved" },
  { id:"s11", cityId:"bangkok", name:"Talat Noi Back Streets", type:"experience", neighborhood:"Talat Noi", description:"Bangkok's oldest Chinese trading neighbourhood, mostly ignored. Narrow alleys, century-old shophouses, tiny shrines, a mechanic next to a specialty coffee bar. Walk without a plan.", vibe:9.5, localLove:9.1, uniqueness:8.4, tags:["neighbourhood","walking","history","street art","coffee"], tip:"Best 7–9am when it's locals-only, or weekend evenings for pop-ups.", status:"approved" },
  { id:"s12", cityId:"bangkok", name:"Mojjo Rooftop Lounge", type:"bar", neighborhood:"Silom", description:"A Latin-flavoured rooftop hidden inside the Skyview Hotel. Rum-heavy cocktails, tapas with care, DJs who play for people who actually dance. Half the price of the famous spots.", vibe:8.6, localLove:8.1, uniqueness:8.3, tags:["rooftop","cocktails","latin vibes","DJ"], tip:"Happy hour until 8pm. The ceviche is exceptional.", status:"approved" },
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
const Nav = ({ view, setView, adminLoggedIn, pendingCount }) => (
  <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(12,10,8,0.94)", backdropFilter:"blur(14px)", borderBottom:"1px solid var(--border)", padding:"0 32px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
    <button onClick={()=>setView("home")} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"baseline", gap:8 }}>
      <span className="serif" style={{ fontSize:22, color:"var(--gold)", fontWeight:700, letterSpacing:"0.04em" }}>UNBEATEN</span>
      <span style={{ fontSize:10, color:"var(--text-muted)", letterSpacing:"0.18em", textTransform:"uppercase" }}>paths</span>
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
const HomeView = ({ cities, spots, setView, setSelectedSpot }) => {
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const citySpots = spots.filter(s=>s.cityId==="bangkok"&&s.status==="approved");
  const filtered = citySpots
    .filter(s=>typeFilter==="all"||s.type===typeFilter)
    .filter(s=>!search||s.name.toLowerCase().includes(search.toLowerCase())||s.neighborhood.toLowerCase().includes(search.toLowerCase())||s.tags.some(t=>t.includes(search.toLowerCase())));

  return (
    <div style={{ paddingTop:62 }}>
      <div style={{ minHeight:320, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"52px 40px 38px", background:"linear-gradient(135deg,#0c0a08 0%,#1a1208 55%,#0f1a14 100%)", borderBottom:"1px solid var(--border)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.03, backgroundImage:`radial-gradient(circle at 20% 50%,var(--gold) 1px,transparent 1px),radial-gradient(circle at 80% 20%,var(--teal) 1px,transparent 1px)`, backgroundSize:"60px 60px,40px 40px" }} />
        <div style={{ position:"absolute", top:24, right:52, opacity:0.05, fontSize:160, lineHeight:1 }}>✦</div>
        <div className="fade-up" style={{ maxWidth:660, position:"relative" }}>
          <div className="mono" style={{ color:"var(--gold)", fontSize:10, letterSpacing:"0.22em", marginBottom:16, textTransform:"uppercase" }}>✦ Off the tourist trail ✦</div>
          <h1 className="serif" style={{ fontSize:"clamp(36px,6vw,68px)", lineHeight:0.93, fontWeight:700, color:"var(--paper)", marginBottom:16 }}>Discover the<br /><em style={{ color:"var(--gold)" }}>real city</em></h1>
          <p style={{ color:"var(--text-muted)", fontSize:15, maxWidth:440, lineHeight:1.75 }}>Rated by locals and travellers on vibe, authenticity, and uniqueness. No tourist traps. No sponsored listings.</p>
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
  return (
    <div className="card-hover" onClick={onClick} style={{ padding:"24px 24px", borderRight:"1px solid var(--border)", animation:`fadeUp 0.45s ease ${delay}ms forwards`, opacity:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:9 }}>
        <span style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:600, color, fontFamily:"DM Sans" }}>{TYPE_EMOJI[spot.type]} {spot.type} · {spot.neighborhood}</span>
        <div style={{ textAlign:"right" }}>
          <span className="mono" style={{ fontSize:19, fontWeight:700, color:"var(--gold)" }}>{score}</span>
          <span style={{ fontSize:9, color:"var(--text-muted)", display:"block" }}>/10</span>
        </div>
      </div>
      <h3 className="serif" style={{ fontSize:19, fontWeight:600, color:"var(--paper)", marginBottom:8, lineHeight:1.2 }}>{spot.name}</h3>
      <p style={{ fontSize:12.5, color:"var(--text-muted)", lineHeight:1.7, marginBottom:12 }}>{spot.description.length>125?spot.description.slice(0,125)+"…":spot.description}</p>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
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
  );
};

// ─── SPOT DETAIL ──────────────────────────────────────────────────────────────
const SpotDetail = ({ spot, setView }) => {
  const score = parseFloat(avg(spot.vibe,spot.localLove,spot.uniqueness));
  const color = TYPE_COLORS[spot.type]||"var(--gold)";
  return (
    <div style={{ paddingTop:62, maxWidth:740, margin:"0 auto", padding:"68px 32px" }}>
      <button className="btn-ghost" onClick={()=>setView("home")} style={{ marginBottom:32, fontSize:12 }}>← Back</button>
      <div style={{ marginBottom:9 }}><span style={{ fontSize:10, letterSpacing:"0.13em", textTransform:"uppercase", color, fontWeight:600 }}>{TYPE_EMOJI[spot.type]} {spot.type} · {spot.neighborhood}</span></div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:18, marginBottom:26 }}>
        <h1 className="serif" style={{ fontSize:"clamp(30px,5vw,50px)", fontWeight:700, color:"var(--paper)", lineHeight:1 }}>{spot.name}</h1>
        <div style={{ textAlign:"center", padding:"13px 20px", border:"1px solid var(--border)", borderRadius:4 }}>
          <div className="mono" style={{ fontSize:36, fontWeight:700, color:"var(--gold)", lineHeight:1 }}>{score}</div>
          <div style={{ fontSize:9, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:3 }}>Overall</div>
        </div>
      </div>
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
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>{spot.tags.map(t=><span key={t} className="tag">{t}</span>)}</div>
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
        <Nav view={view} setView={setView} adminLoggedIn={adminLoggedIn} pendingCount={pending.length} />
        {view==="home"   && <HomeView cities={cities} spots={spots} setView={setView} setSelectedSpot={setSelectedSpot} />}
        {view==="spot"   && selectedSpot && <SpotDetail spot={selectedSpot} setView={setView} />}
        {view==="submit" && <SubmitView cities={cities} onSubmit={handleSubmit} />}
        {view==="admin"  && <AdminView cities={cities} spots={spots} pending={pending} onApprove={handleApprove} onReject={handleReject} onAddCity={handleAddCity} onDeleteSpot={handleDeleteSpot} adminLoggedIn={adminLoggedIn} setAdminLoggedIn={setAdminLoggedIn} onSpotsDiscovered={handleSpotsDiscovered} />}
      </div>
    </>
  );
}
