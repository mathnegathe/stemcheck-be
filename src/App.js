import React, { useState, useEffect } from 'react';
import { Search, User, FileText, BarChart2, ChevronRight, CheckCircle, XCircle, MinusCircle, Menu, X, ArrowLeft, Info, Database, Globe } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';

// --- FIREBASE SETUP ---
// Dit is de correcte en veilige client-side configuratie voor de website.
const firebaseConfig = {
  apiKey: "AIzaSyB6iJVWfwYi1I9WXYCjTIomqC0M1s94RQA",
  authDomain: "stemcheck-33ff9.firebaseapp.com",
  projectId: "stemcheck-33ff9",
  storageBucket: "stemcheck-33ff9.firebasestorage.app",
  messagingSenderId: "785719145136",
  appId: "1:785719145136:web:a471359a7588b54bbd0175"
};

// FIX: Veiligheidscheck voor Canvas-specifieke variabelen. 
// Dit lost de 'is not defined' errors in de Vercel build op.
const globalAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const globalAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = globalAppId; // Gebruik de gecontroleerde lokale variabele

// --- TRANSLATIONS (UI ELEMENTS) ---
const TRANSLATIONS = {
  nl: {
    nav_dashboard: "Dashboard",
    nav_votes: "Stemmingen",
    nav_politicians: "Politici",
    hero_title: "Transparantie in de Wetstraat",
    hero_text: "Volg elke stemming in het parlement. Zie wie er écht jouw belangen verdedigt, voorbij de partijpropaganda.",
    btn_recent_votes: "Bekijk laatste stemmingen",
    btn_search_pol: "Zoek politicus",
    status_live: "Live Database",
    status_demo: "Demo Modus",
    recent_votes_title: "Recente Hoofdelijke Stemmingen",
    view_all: "Alles bekijken",
    passed: "Aangenomen",
    rejected: "Verworpen",
    yes: "Voor",
    no: "Tegen",
    abstain: "Onthouding",
    did_you_know: "Wist je dat?",
    did_you_know_text: "Vorige maand stemden leden van de oppositie in 12% van de gevallen mee met de regering.",
    back_overview: "Terug naar overzicht",
    the_result: "De Uitslag",
    party_voting: "Hoe stemden de fracties?",
    find_rep: "Vind uw vertegenwoordiger",
    search_placeholder: "Zoek op naam, partij of kieskring...",
    rebel_score: "Rebel Score",
    attendance: "Aanwezigheid",
    mandates: "Mandaten",
    voting_record: "Stemgedrag",
    voted: "Heeft gestemd:",
    all_votes: "Alle Stemmingen",
    no_votes_found: "Nog geen stemmingen in de database.",
    load_demo: "Klik hier om demo-data te laden",
    footer_text: "Een burgerinitiatief voor meer transparantie.",
    footer_status: "Status:"
  },
  fr: {
    nav_dashboard: "Tableau de bord",
    nav_votes: "Votes",
    nav_politicians: "Politiciens",
    hero_title: "Transparence Rue de la Loi",
    hero_text: "Suivez chaque vote au parlement. Voyez qui défend vraiment vos intérêts, au-delà de la propagande des partis.",
    btn_recent_votes: "Voir les derniers votes",
    btn_search_pol: "Chercher un politicien",
    status_live: "Base de données Live",
    status_demo: "Mode Démo",
    recent_votes_title: "Votes Nominatifs Récents",
    view_all: "Tout voir",
    passed: "Adopté",
    rejected: "Rejeté",
    yes: "Pour",
    no: "Contre",
    abstain: "Abstention",
    did_you_know: "Le saviez-vous ?",
    did_you_know_text: "Le mois dernier, les membres de l'opposition ont voté avec le gouvernement dans 12% des cas.",
    back_overview: "Retour à l'aperçu",
    the_result: "Le Résultat",
    party_voting: "Comment ont voté les groupes ?",
    find_rep: "Trouvez votre représentant",
    search_placeholder: "Rechercher par nom, parti ou circonscription...",
    rebel_score: "Score Rebelle",
    attendance: "Présence",
    mandates: "Mandats",
    voting_record: "Comportement de vote",
    voted: "A voté :",
    all_votes: "Tous les Votes",
    no_votes_found: "Aucun vote dans la base de données.",
    load_demo: "Cliquez ici pour charger les données de démo",
    footer_text: "Une initiative citoyenne pour plus de transparence.",
    footer_status: "Statut :"
  },
  en: {
    nav_dashboard: "Dashboard",
    nav_votes: "Votes",
    nav_politicians: "Politicians",
    hero_title: "Transparency in Politics",
    hero_text: "Track every vote in parliament. See who truly defends your interests, beyond party propaganda.",
    btn_recent_votes: "View latest votes",
    btn_search_pol: "Search politician",
    status_live: "Live Database",
    status_demo: "Demo Mode",
    recent_votes_title: "Recent Roll Call Votes",
    view_all: "View all",
    passed: "Passed",
    rejected: "Rejected",
    yes: "Yes",
    no: "No",
    abstain: "Abstain",
    did_you_know: "Did you know?",
    did_you_know_text: "Last month, opposition members voted with the government in 12% of cases.",
    back_overview: "Back to overview",
    the_result: "The Result",
    party_voting: "How did parties vote?",
    find_rep: "Find your representative",
    search_placeholder: "Search by name, party or district...",
    rebel_score: "Rebel Score",
    attendance: "Attendance",
    mandates: "Mandates",
    voting_record: "Voting Record",
    voted: "Voted:",
    all_votes: "All Votes",
    no_votes_found: "No votes in database yet.",
    load_demo: "Click here to load demo data",
    footer_text: "A citizen initiative for more transparency.",
    footer_status: "Status:"
  }
};

// --- MOCK DATA (TRANSLATED CONTENT) ---
const MOCK_PARTIES = {
  'N-VA': { name: 'N-VA', color: 'bg-yellow-500', text: 'text-yellow-700' },
  'PS': { name: 'PS', color: 'bg-red-600', text: 'text-red-700' },
  'VB': { name: 'Vlaams Belang', color: 'bg-yellow-950', text: 'text-yellow-900' },
  'MR': { name: 'MR', color: 'bg-blue-600', text: 'text-blue-700' },
  'ECOLO': { name: 'Ecolo-Groen', color: 'bg-green-500', text: 'text-green-700' },
  'CDV': { name: 'CD&V', color: 'bg-orange-500', text: 'text-orange-700' },
  'PVDA': { name: 'PVDA-PTB', color: 'bg-red-800', text: 'text-red-900' },
  'OPEN': { name: 'Open Vld', color: 'bg-blue-400', text: 'text-blue-700' },
  'VOORUIT': { name: 'Vooruit', color: 'bg-red-500', text: 'text-red-700' },
  'LE': { name: 'Les Engagés', color: 'bg-teal-500', text: 'text-teal-700' }
};

const MOCK_POLITICIANS = [
  { id: '1', name: 'Bart De Wever', party: 'N-VA', region: {nl: 'Antwerpen', fr: 'Anvers', en: 'Antwerp'}, rebelScore: 0.5, img: 'BDW' },
  { id: '2', name: 'Paul Magnette', party: 'PS', region: {nl: 'Henegouwen', fr: 'Hainaut', en: 'Hainaut'}, rebelScore: 1.2, img: 'PM' },
  { id: '3', name: 'Alexander De Croo', party: 'OPEN', region: {nl: 'Oost-Vlaanderen', fr: 'Flandre orientale', en: 'East Flanders'}, rebelScore: 2.1, img: 'ADC' },
  { id: '4', name: 'Raoul Hedebouw', party: 'PVDA', region: {nl: 'Luik', fr: 'Liège', en: 'Liège'}, rebelScore: 0.0, img: 'RH' },
  { id: '5', name: 'Sammy Mahdi', party: 'CDV', region: {nl: 'Vlaams-Brabant', fr: 'Brabant flamand', en: 'Flemish Brabant'}, rebelScore: 3.5, img: 'SM' },
  { id: '6', name: 'Petra De Sutter', party: 'ECOLO', region: {nl: 'Oost-Vlaanderen', fr: 'Flandre orientale', en: 'East Flanders'}, rebelScore: 1.8, img: 'PDS' },
  { id: '7', name: 'Georges-Louis Bouchez', party: 'MR', region: {nl: 'Henegouwen', fr: 'Hainaut', en: 'Hainaut'}, rebelScore: 4.2, img: 'GLB' },
  { id: '8', name: 'Tom Van Grieken', party: 'VB', region: {nl: 'Antwerpen', fr: 'Anvers', en: 'Antwerp'}, rebelScore: 0.2, img: 'TVG' },
];

const MOCK_VOTES = [
  {
    id: '101',
    title: {
      nl: 'Wetsontwerp houdende de algemene uitgavenbegroting voor het begrotingsjaar 2024',
      fr: 'Projet de loi contenant le budget général des dépenses pour l\'année budgétaire 2024',
      en: 'Bill containing the general expenditure budget for the budget year 2024'
    },
    date: '2023-12-21',
    type: 'Wet',
    description: {
      nl: 'De jaarlijkse stemming over de federale begroting. Dit bepaalt hoeveel geld er naar welke overheidsdiensten gaat.',
      fr: 'Le vote annuel sur le budget fédéral. Cela détermine combien d\'argent va à quels services publics.',
      en: 'The annual vote on the federal budget. This determines how much money goes to which public services.'
    },
    passed: true,
    stats: { yes: 87, no: 55, abstain: 8 },
    partyVotes: {
      'N-VA': 'no', 'PS': 'yes', 'VB': 'no', 'MR': 'yes', 'ECOLO': 'yes', 'CDV': 'yes', 'PVDA': 'no', 'OPEN': 'yes', 'VOORUIT': 'yes', 'LE': 'abstain'
    }
  },
  {
    id: '102',
    title: {
      nl: 'Resolutie betreffende de erkenning van de hongersnood in Oekraïne (Holodomor) als genocide',
      fr: 'Résolution relative à la reconnaissance de la famine en Ukraine (Holodomor) comme génocide',
      en: 'Resolution regarding the recognition of the famine in Ukraine (Holodomor) as genocide'
    },
    date: '2023-03-09',
    type: 'Resolutie',
    description: {
      nl: 'Erkenning van de historische hongersnood veroorzaakt door het Sovjetregime als een daad van genocide.',
      fr: 'Reconnaissance de la famine historique causée par le régime soviétique comme un acte de génocide.',
      en: 'Recognition of the historical famine caused by the Soviet regime as an act of genocide.'
    },
    passed: true,
    stats: { yes: 148, no: 0, abstain: 2 },
    partyVotes: {
      'N-VA': 'yes', 'PS': 'yes', 'VB': 'yes', 'MR': 'yes', 'ECOLO': 'yes', 'CDV': 'yes', 'PVDA': 'abstain', 'OPEN': 'yes', 'VOORUIT': 'yes', 'LE': 'yes'
    }
  },
  {
    id: '103',
    title: {
      nl: 'Wetsvoorstel tot wijziging van de wet betreffende de kernuitstap',
      fr: 'Proposition de loi modifiant la loi sur la sortie du nucléaire',
      en: 'Bill amending the law on the nuclear phase-out'
    },
    date: '2023-11-15',
    type: 'Wetsvoorstel',
    description: {
      nl: 'Voorstel om de levensduur van reactoren Doel 4 en Tihange 3 met 10 jaar te verlengen.',
      fr: 'Proposition de prolonger la durée de vie des réactoren Doel 4 et Tihange 3 de 10 ans.',
      en: 'Proposal to extend the lifespan of reactors Doel 4 and Tihange 3 by 10 years.'
    },
    passed: true,
    stats: { yes: 80, no: 60, abstain: 10 },
    partyVotes: {
      'N-VA': 'yes', 'PS': 'no', 'VB': 'yes', 'MR': 'yes', 'ECOLO': 'no', 'CDV': 'yes', 'PVDA': 'no', 'OPEN': 'yes', 'VOORUIT': 'no', 'LE': 'yes'
    }
  },
];

// --- HELPER COMPONENTS ---

const PartyBadge = ({ partyCode, size = 'sm' }) => {
  const party = MOCK_PARTIES[partyCode] || { name: partyCode, color: 'bg-gray-500', text: 'text-gray-700' };
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  
  return (
    <span className={`${party.color} text-white font-bold rounded-full ${sizeClasses}`}>
      {party.name}
    </span>
  );
};

const VoteBar = ({ stats, t }) => {
  const total = (stats.yes || 0) + (stats.no || 0) + (stats.abstain || 0);
  const yesPct = total > 0 ? (stats.yes / total) * 100 : 0;
  const noPct = total > 0 ? (stats.no / total) * 100 : 0;
  
  return (
    <div className="w-full h-4 bg-gray-200 rounded-full flex overflow-hidden mt-2">
      <div className="bg-emerald-500 h-full" style={{ width: `${yesPct}%` }} title={`${t('yes')}: ${stats.yes}`} />
      <div className="bg-rose-500 h-full" style={{ width: `${noPct}%` }} title={`${t('no')}: ${stats.no}`} />
      <div className="bg-gray-400 h-full flex-grow" title={`${t('abstain')}: ${stats.abstain}`} />
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function BelgianVoteTracker() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState('nl'); // nl, fr, en
  const [selectedVoteId, setSelectedVoteId] = useState(null);
  const [selectedPolId, setSelectedPolId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data State
  const [votes, setVotes] = useState(MOCK_VOTES);
  const [politicians, setPoliticians] = useState(MOCK_POLITICIANS);
  const [isUsingLive, setIsUsingLive] = useState(false);

  // Translation Helper for UI
  const t = (key) => TRANSLATIONS[language][key] || key;

  // Translation Helper for Content (Handles string or object)
  const getLoc = (content) => {
    if (typeof content === 'object' && content !== null) {
      return content[language] || content['nl'] || '';
    }
    return content;
  };

  // 1. AUTHENTICATIE STARTEN
  useEffect(() => {
    const initAuth = async () => {
      // Check of Firebase al is geïnitialiseerd (om errors bij herladen te voorkomen)
      if (!app) return; 

      const token = globalAuthToken; // Gebruik de gecontroleerde lokale variabele
      
      if (token) {
        try {
            await signInWithCustomToken(auth, token);
        } catch (error) {
            console.error("Custom token sign-in failed, falling back to anonymous:", error);
            await signInAnonymously(auth);
        }
      } else {
        await signInAnonymously(auth);
      }
    };

    if (app && Object.keys(firebaseConfig).length > 0) {
        initAuth();
    }
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
    });
    return () => unsubscribe();
  }, [app]);

  // 2. DATA OPHALEN (LIVE)
  useEffect(() => {
    if (!user || !db) return;

    // Construct the base path for public data
    const basePath = ['artifacts', appId, 'public', 'data'];

    // Listen to Votes
    const votesQuery = query(collection(db, ...basePath, 'votes'));
    const unsubVotes = onSnapshot(votesQuery, (snapshot) => {
        if (!snapshot.empty) {
            const liveVotes = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            setVotes(liveVotes);
            setIsUsingLive(true);
        }
    }, (error) => console.error("Error fetching votes:", error));

    // Listen to Politicians
    const polQuery = query(collection(db, ...basePath, 'politicians'));
    const unsubPol = onSnapshot(polQuery, (snapshot) => {
        if (!snapshot.empty) {
            const livePols = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            setPoliticians(livePols);
        }
    }, (error) => console.error("Error fetching politicians:", error));

    return () => {
        unsubVotes();
        unsubPol();
    };
  }, [user, db]);

  // Utility to seed DB for demo purposes
  const seedDatabase = async () => {
      if (!user || !db) {
        alert(language === 'nl' ? "Database niet klaar. Controleer uw Firebase Config." : "Database not ready. Check your Firebase Config.");
        return;
      }
      
      const basePath = ['artifacts', appId, 'public', 'data'];
      const votesCollectionRef = collection(db, ...basePath, 'votes');
      const politiciansCollectionRef = collection(db, ...basePath, 'politicians');
      
      try {
        MOCK_VOTES.forEach(async (v) => {
            await addDoc(votesCollectionRef, v);
        });
        MOCK_POLITICIANS.forEach(async (p) => {
            await addDoc(politiciansCollectionRef, p);
        });
        alert(language === 'nl' ? "Demo data geladen! De pagina zal nu overschakelen naar 'Live Database'." : "Demo data loaded! The page will now switch to 'Live Database'.");
      } catch (error) {
        console.error("Error seeding database: ", error);
        alert(language === 'nl' ? `Fout bij het laden van demo data. Controleer de Firestore Rules: ${error.message}` : `Error loading demo data. Check Firestore Rules: ${error.message}`);
      }
  };

  // Navigation Logic
  const goHome = () => { setActiveTab('home'); setSelectedVoteId(null); setSelectedPolId(null); setMobileMenuOpen(false); };
  const goToVotes = () => { setActiveTab('votes'); setSelectedVoteId(null); setMobileMenuOpen(false); };
  const goToPoliticians = () => { setActiveTab('politicians'); setSelectedPolId(null); setMobileMenuOpen(false); };
  
  const selectVote = (id) => { setSelectedVoteId(id); setActiveTab('vote-detail'); };
  const selectPolitician = (id) => { setSelectedPolId(id); setActiveTab('pol-detail'); };

  const switchLanguage = (lang) => {
      setLanguage(lang);
      setMobileMenuOpen(false);
  };

  // --- SUB-VIEWS ---

  const HomeView = () => (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">{t('hero_title')}</h1>
            <p className="text-slate-300 mb-6 max-w-xl">
            {t('hero_text')}
            </p>
            <div className="flex flex-wrap gap-4">
            <button onClick={goToVotes} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                {t('btn_recent_votes')}
            </button>
            <button onClick={goToPoliticians} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                {t('btn_search_pol')}
            </button>
            </div>
        </div>
        {/* Status indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full text-xs border border-slate-700">
            <div className={`w-2 h-2 rounded-full ${isUsingLive ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
            <span className="text-slate-300">{isUsingLive ? t('status_live') : t('status_demo')}</span>
        </div>
      </div>

      {/* Featured Votes */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-slate-900">{t('recent_votes_title')}</h2>
          <button onClick={goToVotes} className="text-blue-600 text-sm font-medium hover:underline flex items-center">
            {t('view_all')} <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {votes.slice(0, 4).map(vote => (
            <div key={vote.id} onClick={() => selectVote(vote.id)} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${vote.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {vote.passed ? t('passed') : t('rejected')}
                </span>
                <span className="text-slate-400 text-xs">{vote.date}</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {getLoc(vote.title)}
              </h3>
              <VoteBar stats={vote.stats} t={t} />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>{t('yes')}: <b>{vote.stats.yes}</b></span>
                <span>{t('no')}: <b>{vote.stats.no}</b></span>
              </div>
            </div>
          ))}
        </div>
        {votes.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 mb-2">{t('no_votes_found')}</p>
                <button onClick={seedDatabase} className="text-blue-600 text-sm font-medium hover:underline">
                    {t('load_demo')}
                </button>
            </div>
        )}
      </div>

      {/* Stats Teaser */}
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-bold text-blue-900 text-lg">{t('did_you_know')}</h3>
          <p className="text-blue-800">
            {t('did_you_know_text')}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <BarChart2 className="text-blue-500" />
        </div>
      </div>
    </div>
  );

  const VoteDetailView = () => {
    const vote = votes.find(v => v.id === selectedVoteId);
    if (!vote) return <div>Vote not found</div>;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button onClick={goToVotes} className="flex items-center text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft size={16} className="mr-2" /> {t('back_overview')}
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-sm font-medium">{vote.type}</span>
            <span className="text-slate-400 text-sm">{vote.date}</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{getLoc(vote.title)}</h1>
          <p className="text-slate-600 mb-8 leading-relaxed border-l-4 border-blue-500 pl-4 bg-slate-50 p-4 rounded-r-lg">
            {getLoc(vote.description)}
          </p>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">{t('the_result')}</h3>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
               <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="font-medium text-emerald-900">{t('yes')}</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{vote.stats.yes}</span>
               </div>
               <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <span className="font-medium text-rose-900">{t('no')}</span>
                  </div>
                  <span className="text-2xl font-bold text-rose-600">{vote.stats.no}</span>
               </div>
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                    <span className="font-medium text-slate-700">{t('abstain')}</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-500">{vote.stats.abstain}</span>
               </div>
               <div className="mt-4">
                <VoteBar stats={vote.stats} t={t} />
               </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">{t('party_voting')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(vote.partyVotes || {}).map(([partyCode, voteType]) => (
                <div key={partyCode} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                  <PartyBadge partyCode={partyCode} />
                  <div className="flex items-center gap-2">
                    {voteType === 'yes' && <span className="text-emerald-600 font-bold flex items-center text-sm"><CheckCircle size={14} className="mr-1"/> {t('yes')}</span>}
                    {voteType === 'no' && <span className="text-rose-600 font-bold flex items-center text-sm"><XCircle size={14} className="mr-1"/> {t('no')}</span>}
                    {voteType === 'abstain' && <span className="text-slate-500 font-bold flex items-center text-sm"><MinusCircle size={14} className="mr-1"/> {t('abstain')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PoliticiansView = () => {
    const filteredPoliticians = politicians.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.party.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('find_rep')}</h2>
        
        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder={t('search_placeholder')}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPoliticians.map(pol => (
            <div key={pol.id} onClick={() => selectPolitician(pol.id)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-slate-100 rounded-full mb-4 flex items-center justify-center text-slate-400 font-bold text-xl overflow-hidden">
                {/* Mock Image placeholder */}
                {pol.img}
              </div>
              <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600">{pol.name}</h3>
              <div className="mt-2 mb-4">
                <PartyBadge partyCode={pol.party} />
              </div>
              <p className="text-sm text-slate-500 mb-1">{getLoc(pol.region)}</p>
              
              <div className="w-full mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                 <span className="text-slate-500">{t('rebel_score')}</span>
                 <span className={`font-bold ${pol.rebelScore > 3 ? 'text-orange-500' : 'text-slate-700'}`}>
                    {pol.rebelScore}%
                 </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PoliticianDetailView = () => {
    const pol = politicians.find(p => p.id === selectedPolId);
    if (!pol) return <div>Politicus niet gevonden</div>;

    const personalVotes = votes.map(v => {
        const partyVote = v.partyVotes ? v.partyVotes[pol.party] : 'abstain';
        return { ...v, myVote: partyVote }; 
    });

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
         <button onClick={goToPoliticians} className="flex items-center text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft size={16} className="mr-2" /> {t('back_overview')}
        </button>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-6">
            <div className="bg-slate-900 h-32 relative">
                <div className="absolute -bottom-12 left-8">
                     <div className="w-24 h-24 bg-white rounded-full border-4 border-white flex items-center justify-center text-2xl font-bold text-slate-300 shadow-lg">
                        {pol.img}
                     </div>
                </div>
            </div>
            <div className="pt-16 pb-6 px-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{pol.name}</h1>
                        <p className="text-slate-500">{getLoc(pol.region)}</p>
                    </div>
                    <PartyBadge partyCode={pol.party} size="lg" />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <span className="block text-xs text-slate-500 uppercase">{t('attendance')}</span>
                        <span className="text-lg font-bold text-slate-800">92%</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <span className="block text-xs text-slate-500 uppercase">{t('rebel_score')}</span>
                        <span className="text-lg font-bold text-slate-800 flex items-center gap-1">
                            {pol.rebelScore}%
                            <Info size={12} className="text-slate-400" />
                        </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <span className="block text-xs text-slate-500 uppercase">{t('nav_votes')}</span>
                        <span className="text-lg font-bold text-slate-800">412</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <span className="block text-xs text-slate-500 uppercase">{t('mandates')}</span>
                        <span className="text-lg font-bold text-slate-800">3</span>
                    </div>
                </div>
            </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-4">{t('voting_record')}</h3>
        <div className="space-y-3">
            {personalVotes.map(vote => (
                <div key={vote.id} onClick={() => selectVote(vote.id)} className="bg-white p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <span className="text-xs text-slate-400">{vote.date}</span>
                        <h4 className="font-medium text-slate-800 line-clamp-1">{getLoc(vote.title)}</h4>
                    </div>
                    <div className="flex flex-col items-end min-w-[80px]">
                        <span className="text-xs text-slate-400 mb-1">{t('voted')}</span>
                        {vote.myVote === 'yes' && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded flex items-center"><CheckCircle size={12} className="mr-1"/> {t('yes').toUpperCase()}</span>}
                        {vote.myVote === 'no' && <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded flex items-center"><XCircle size={12} className="mr-1"/> {t('no').toUpperCase()}</span>}
                        {vote.myVote === 'abstain' && <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded flex items-center"><MinusCircle size={12} className="mr-1"/> {t('abstain').toUpperCase()}</span>}
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  };

  const VotesListView = () => (
    <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('all_votes')}</h2>
        <div className="grid gap-4">
            {votes.map(vote => (
                <div key={vote.id} onClick={() => selectVote(vote.id)} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${vote.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {vote.passed ? t('passed') : t('rejected')}
                        </span>
                        <span className="text-slate-400 text-sm">{vote.date}</span>
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">{vote.type}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{getLoc(vote.title)}</h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">{getLoc(vote.description)}</p>
                    <VoteBar stats={vote.stats} t={t} />
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={goHome}>
              <div className="bg-blue-600 text-white p-1.5 rounded mr-2">
                <FileText size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">StemCheck<span className="text-blue-600">.be</span></span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={goHome} className={`text-sm font-medium transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>{t('nav_dashboard')}</button>
              <button onClick={goToVotes} className={`text-sm font-medium transition-colors ${activeTab === 'votes' || activeTab === 'vote-detail' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>{t('nav_votes')}</button>
              <button onClick={goToPoliticians} className={`text-sm font-medium transition-colors ${activeTab === 'politicians' || activeTab === 'pol-detail' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>{t('nav_politicians')}</button>
              
              <div className="h-4 w-px bg-slate-300 mx-2"></div>
              
              <div className="flex items-center space-x-2">
                <button onClick={() => switchLanguage('nl')} className={`text-xs font-bold px-2 py-1 rounded ${language === 'nl' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>NL</button>
                <button onClick={() => switchLanguage('fr')} className={`text-xs font-bold px-2 py-1 rounded ${language === 'fr' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>FR</button>
                <button onClick={() => switchLanguage('en')} className={`text-xs font-bold px-2 py-1 rounded ${language === 'en' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>EN</button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-500 hover:text-slate-800">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={goHome} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 w-full text-left">{t('nav_dashboard')}</button>
              <button onClick={goToVotes} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 w-full text-left">{t('nav_votes')}</button>
              <button onClick={goToPoliticians} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 w-full text-left">{t('nav_politicians')}</button>
              <div className="flex gap-4 p-3 border-t border-slate-100 mt-2">
                 <button onClick={() => switchLanguage('nl')} className={`flex-1 py-2 text-center rounded text-sm font-bold ${language === 'nl' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>NL</button>
                 <button onClick={() => switchLanguage('fr')} className={`flex-1 py-2 text-center rounded text-sm font-bold ${language === 'fr' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>FR</button>
                 <button onClick={() => switchLanguage('en')} className={`flex-1 py-2 text-center rounded text-sm font-bold ${language === 'en' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>EN</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'votes' && <VotesListView />}
        {activeTab === 'vote-detail' && <VoteDetailView />}
        {activeTab === 'politicians' && <PoliticianDetailView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p className="mb-2">&copy; 2024 StemCheck.be - {t('footer_text')}</p>
          <div className="flex justify-center gap-2 items-center">
             <Database size={14} className={isUsingLive ? 'text-green-500' : 'text-orange-400'} />
             <span>{t('footer_status')} {isUsingLive ? t('status_live') : t('status_demo')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}