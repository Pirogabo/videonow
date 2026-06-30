/* ================================================================
   VIDEONOW — MOCK DATA STORE
   Reemplaza esto por llamadas reales a Supabase cuando conectes
   la base de datos (ver SETUP.md → sección Supabase).
   ================================================================ */

const THUMB_COLORS = ['#0d1b2a','#1b3a5c','#1a1a2e','#16213e','#0f3460','#162032','#2c1338','#3a1f1f'];
function thumbColor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return THUMB_COLORS[h % THUMB_COLORS.length];
}

const CHANNELS = [
  { id:'elrubius',   name:'elrubiusOMG',        subs:'9.2M',  avatar:'E', color:'#e74c3c', desc:'Vídeos random, gameplays y muchas risas. Bienvenido criaturita.' },
  { id:'ellenshow',  name:'TheEllenShow',        subs:'11.4M', avatar:'T', color:'#3498db', desc:'Clips oficiales del show de Ellen DeGeneres.' },
  { id:'watchmojo',  name:'WatchMojo',           subs:'7.3M',  avatar:'W', color:'#9b59b6', desc:'Top 10 listas sobre todo lo que te puedas imaginar.' },
  { id:'arianavevo', name:'ArianaGrandeVevo',    subs:'18M',   avatar:'A', color:'#e91e63', desc:'Canal oficial de música de Ariana Grande.' },
  { id:'markronson', name:'MarkRonsonVEVO',      subs:'3.1M',  avatar:'M', color:'#f39c12', desc:'Canal oficial de Mark Ronson.' },
  { id:'lastweek',   name:'LastWeekTonight',     subs:'6.8M',  avatar:'L', color:'#1abc9c', desc:'Clips del show de John Oliver en HBO.' },
  { id:'mirandalambert', name:'MirandaLambertVEVO', subs:'2.4M', avatar:'M', color:'#16a085', desc:'Canal oficial de música de Miranda Lambert.' },
  { id:'skrillex',   name:'Skrillex',            subs:'14M',   avatar:'S', color:'#8e44ad', desc:'Canal oficial de Skrillex.' },
];

function getChannel(id) { return CHANNELS.find(c => c.id === id) || CHANNELS[0]; }

const VIDEOS = [
  {
    id:'v1', title:'Mission: Impossible Rogue Nation - Fate Trailer (HD)', ch:'watchmojo', views:3412890, time:'1 day ago', duration:'1:05', cat:'movies',
    desc:'El nuevo tráiler de la saga Mission Impossible llega con todo. Persecuciones, espías y mucha acción.',
    // Demo real con Shaka Player: HLS público de libre uso (Big Buck Bunny, Blender Foundation).
    // Sustituye `src` por la URL real de tu CDN/Storage cuando conectes el backend.
    src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    subtitles: [
      { lang:'es', label:'Español', kind:'vtt', url:'assets/subs/demo-es.vtt', default:true }
    ]
  },
  { id:'v2', title:'Last Week Tonight: Municipal Violations (HBO)', ch:'lastweek', views:492300, time:'17 hours ago', duration:'17:55', cat:'news', desc:'John Oliver habla sobre las multas municipales y cómo afectan a las comunidades de bajos ingresos.' },
  { id:'v3', title:'Ariana Grande Does a Spot-On Celine Dion Impression', ch:'ellenshow', views:7600000, time:'2 days ago', duration:'2:21', cat:'music', desc:'Ariana sorprende a todos imitando a Celine Dion en el show de Ellen.' },
  { id:'v4', title:'Lego Matrix Lobby Fight Scene Recreation', ch:'watchmojo', views:685200, time:'1 day ago', duration:'4:27', cat:'gaming', desc:'Una recreación stop-motion de la icónica escena del lobby de Matrix, hecha completamente con Lego.' },
  { id:'v5', title:'Mark Ronson - Uptown Funk ft. Bruno Mars (Official Video)', ch:'markronson', views:400000000, time:'4 months ago', duration:'4:31', cat:'music', desc:'Video oficial de Uptown Funk. Directed by Bruno Mars and Cameron Duddy.' },
  { id:'v6', title:'DE FIESTA CON SKRILLEX | Especial 6 MILLONES DE CRIATURITAS', ch:'elrubius', views:6800000, time:'Mar 1, 2014', duration:'7:03', cat:'gaming', desc:'¡6 MILLONES DE CRIATURITAS! Para celebrarlo nos vamos de fiesta con Skrillex. No os lo podéis perder.' },
  { id:'v7', title:'APRENDIENDO A SER CAZADOR | Monster Hunter', ch:'elrubius', views:2100000, time:'2 months ago', duration:'15:22', cat:'gaming', desc:'Hoy toca aprender a cazar monstruos enormes. Gameplay completo con mil muertes.' },
  { id:'v8', title:'SIMULADOR DE CABRA EXTREMA 2014', ch:'elrubius', views:5200000, time:'3 months ago', duration:'12:08', cat:'gaming', desc:'El simulador más absurdo del año. Sé una cabra y destrúyelo todo.' },
  { id:'v9', title:'Ellie Goulding - Love Me Like You Do (Official Video)', ch:'arianavevo', views:187000000, time:'2 months ago', duration:'4:10', cat:'music', desc:'Video musical oficial de Love Me Like You Do, de la banda sonora de 50 Sombras de Grey.' },
  { id:'v10', title:'Sia - Elastic Heart ft. Shia LaBeouf & Maddie Ziegler', ch:'markronson', views:197000000, time:'2 months ago', duration:'5:08', cat:'music', desc:'Video oficial de Elastic Heart, dirigido por Sia y Daniel Askill.' },
  { id:'v11', title:'Taylor Swift - Style (Official Music Video)', ch:'arianavevo', views:81000000, time:'1 month ago', duration:'4:04', cat:'music', desc:'Video oficial de Style del álbum 1989.' },
  { id:'v12', title:'Top 10 Awkward Moments in Live TV History', ch:'watchmojo', views:1800000, time:'1 month ago', duration:'13:11', cat:'education', desc:'Los momentos más incómodos jamás transmitidos en vivo por televisión.' },
  { id:'v13', title:'Miranda Lambert - Little Red Wagon (Official Video)', ch:'mirandalambert', views:42000000, time:'3 months ago', duration:'3:38', cat:'music', desc:'Video musical oficial de Little Red Wagon.' },
  { id:'v14', title:'Skrillex - Bangarang ft. Sirah (Official Video)', ch:'skrillex', views:215000000, time:'5 months ago', duration:'3:35', cat:'music', desc:'Video oficial de Bangarang. Dirigido por Tony T.' },
  { id:'v15', title:'BuzzFeed Proposal on WGN Chicago', ch:'ellenshow', views:9800, time:'9 hours ago', duration:'2:45', cat:'news', desc:'Una propuesta de matrimonio sorpresa en vivo durante un noticiero.' },
  { id:'v16', title:'Despicable Me 3 Trailer - Official', ch:'watchmojo', views:34800000, time:'Jun 1, 2015', duration:'2:31', cat:'movies', desc:'Tráiler oficial de Despicable Me 3. Los Minions vuelven con más travesuras.' },
];

function getVideo(id) { return VIDEOS.find(v => v.id === id); }
function videosByCategory(cat) { return cat === 'all' ? VIDEOS : VIDEOS.filter(v => v.cat === cat); }
function videosByChannel(chId) { return VIDEOS.filter(v => v.ch === chId); }
function relatedVideos(excludeId, limit) {
  return VIDEOS.filter(v => v.id !== excludeId).sort(() => Math.random() - 0.5).slice(0, limit || 10);
}

const COMMENTS = {
  v6: [
    { author:'Criaturita2014', time:'2 años atrás', text:'JAJAJAJA esto es lo mejor que ha pasado en este canal', likes:243 },
    { author:'PandaLover99', time:'2 años atrás', text:'6 MILLONES!! no me lo puedo creer, sigue así rubius', likes:128 },
    { author:'GamerXxX', time:'1 año atrás', text:'Este video nunca pasa de moda, lo vuelvo a ver cada año jaja', likes:67 },
  ],
  v5: [
    { author:'MusicFan2015', time:'3 meses atrás', text:'Esta canción nunca envejece, una obra maestra', likes:892 },
    { author:'DanceQueen', time:'2 meses atrás', text:'No puedo quedarme quieto cuando suena esto', likes:445 },
  ],
};
function getComments(videoId) {
  return COMMENTS[videoId] || [
    { author:'Usuario1', time:'hace 5 horas', text:'¡Gran video! Me encantó el contenido.', likes:Math.floor(Math.random()*50) },
    { author:'Usuario2', time:'hace 1 día', text:'Sigue subiendo contenido así de calidad.', likes:Math.floor(Math.random()*30) },
  ];
}

const CHAT_ROOMS = [
  { id:'general', name:'General', online:342, lastMsg:'¿alguien vio el video nuevo?' },
  { id:'gaming',  name:'Gaming Lounge', online:128, lastMsg:'ese boss es imposible' },
  { id:'music',   name:'Music Talk', online:96,  lastMsg:'top 5 canciones del mes?' },
  { id:'memes',   name:'Memes & Random', online:215, lastMsg:'jajajaja no puedo' },
  { id:'help',    name:'Ayuda & Soporte', online:18,  lastMsg:'¿cómo subo un video?' },
];

const CHAT_MESSAGES = {
  general: [
    { author:'Lucia_22', text:'buenas tardes a todos!', time:'14:02' },
    { author:'GamerMax', text:'alguien vio el nuevo video de elrubius?', time:'14:05' },
    { author:'Lucia_22', text:'sii esta increíble jaja', time:'14:06' },
    { author:'PandaFan', text:'el de skrillex es un clásico', time:'14:10' },
  ],
  gaming: [
    { author:'NoobMaster', text:'ese boss final es imposible sin ayuda', time:'13:40' },
    { author:'ProPlayer99', text:'usa el escudo en la segunda fase', time:'13:42' },
  ],
};
function getChatMessages(roomId) { return CHAT_MESSAGES[roomId] || []; }

/* ================================================================
   VIDEOS SUBIDOS POR USUARIOS (localStorage)
   Extiende el catálogo mock — no lo reemplaza. Estas funciones son
   las que deben usar las páginas en vez de leer VIDEOS directamente
   cuando quieran ver también lo que han subido los usuarios.
   ================================================================ */

function getUserVideos() {
  try { return JSON.parse(localStorage.getItem('vn_videos') || '[]'); }
  catch { return []; }
}

function saveUserVideos(videos) {
  localStorage.setItem('vn_videos', JSON.stringify(videos));
}

function getAllVideos() {
  return [...VIDEOS, ...getUserVideos()];
}

function getVideoById(id) {
  return getAllVideos().find(v => v.id === id) || null;
}

/** Normaliza un video (mock o subido por usuario) a un shape común para las plantillas. */
function normalizeVideo(v) {
  if (!v) return null;
  const isUserUpload = String(v.id).startsWith('uv_');
  return {
    id: v.id,
    title: v.title,
    desc: v.desc || '',
    duration: v.duration || '0:00',
    cat: v.cat || 'all',
    views: v.views || 0,
    time: v.time || formatRelativeTime(v.createdAt),
    channelName: isUserUpload ? (v.channelName || 'Usuario') : getChannel(v.ch).name,
    channelId: isUserUpload ? (v.uploadedBy || '') : v.ch,
    thumb: v.thumb || null,
    src: v.src || null,
    subtitles: v.subtitles || [],
    isUserUpload,
    likes: v.likes || 0,
    dislikes: v.dislikes || 0,
    tags: v.tags || [],
    visibility: v.visibility || 'public',
  };
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'justo ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} día${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} mes${months === 1 ? '' : 'es'}`;
  return `hace ${Math.floor(months / 12)} año(s)`;
}
