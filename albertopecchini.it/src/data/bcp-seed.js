// «Better Call Pekko» — il database iniziale della parodia (forum, guestbook,
// shoutbox). Lo usano api/bcp.js, quando il file su Vercel Blob non esiste ancora,
// e il template, che lo stampa nell'HTML così la pagina ha contenuto anche senza
// JavaScript o con il database spento. I contatori partono da zero: sono veri.
// Discussioni e recensioni del 2009 restano come archivio (sono la parodia);
// quelle nuove, vere, si aggiungono sopra.

const at = (s) => Date.parse(s)

export const seed = () => ({
  v: 1,
  visits: 0,
  online: [],
  likes: {},
  shares: {},
  ecards: 0,
  poll: [0, 0, 0, 0, 0, 0],
  scores: [],
  threads: [
    { id: 'sticky', title: '[STICKY] READ B4 POSTING: have u tried turning it off and on again', by: 'pekko', ts: at('2006-06-28T09:00:00Z'), sticky: true, locked: true, posts: [{ by: 'pekko', ts: at('2006-06-28T09:00:00Z'), text: 'hi and welcome 2 the forum!!! b4 u post: 1) turn it off 2) turn it on 3) if its still broke post here or better call me. no spam no links no drama. its all good, man' }] },
    { id: 'printer', title: '[SOLVED] printer prints blank pages!!!', by: 'grandma_rita', ts: at('2009-03-14T21:02:00Z'), posts: [{ by: 'grandma_rita', ts: at('2009-03-14T21:02:00Z'), text: 'my printer prints only white pages. is it broke??? i tried 2 shake it' }, { by: 'pekko', ts: at('2009-03-14T22:40:00Z'), text: 'the cartridge still had the orange tape on. took it off. its printing. u owe me a coffee' }, { by: 'grandma_rita', ts: at('2009-03-15T08:11:00Z'), text: 'OMG IT WORKS!!!! god bless u pekko' }] },
    { id: 'msn', title: 'HELP!!! my msn wont login', by: 'jessica_88', ts: at('2009-04-02T19:30:00Z'), posts: [{ by: 'jessica_88', ts: at('2009-04-02T19:30:00Z'), text: 'it says error 80048820 plz help my bff is online!!!' }, { by: 'BigTony_MN', ts: at('2009-04-02T20:01:00Z'), text: 'the clock on ur pc is wrong. fix the date and it works. learned from pekko' }] },
    { id: 'vista', title: 'Vista or XP???? (need advice)', by: 'dave', ts: at('2009-05-19T10:00:00Z'), hot: true, posts: [{ by: 'dave', ts: at('2009-05-19T10:00:00Z'), text: 'should i upgrade 2 vista. my friend says its faster' }, { by: 'raven_666', ts: at('2009-05-19T11:13:00Z'), text: 'ur friend lies' }, { by: 'pekko', ts: at('2009-05-19T12:00:00Z'), text: 'stay on xp and wait 4 windows 7. trust me im the computer guy' }] },
    { id: 'antivirus', title: 'best antivirus 2009??', by: 'mike_from_mantova', ts: at('2009-06-28T15:20:00Z'), posts: [{ by: 'mike_from_mantova', ts: at('2009-06-28T15:20:00Z'), text: 'i have 3 antivirus installed and the pc is slow. which one is best' }, { by: 'pekko', ts: at('2009-06-28T16:05:00Z'), text: 'one. the best antivirus is ONE antivirus. u have 3 and they r fighting each other lol' }] },
    { id: 'limewire', title: 'is limewire safe?', by: 'xXx_D4rk_L0rd_xXx', ts: at('2009-08-23T02:12:00Z'), locked: true, posts: [{ by: 'xXx_D4rk_L0rd_xXx', ts: at('2009-08-23T02:12:00Z'), text: 'asking 4 a friend' }, { by: 'pekko', ts: at('2009-08-23T09:00:00Z'), text: 'no. topic locked. call me when ur friend has 47 toolbars' }] },
    { id: 'suit', title: "PEKKO'S OUTFIT: rate the yellow suit", by: 'the_snail', ts: at('2009-11-30T18:00:00Z'), hot: true, posts: [{ by: 'the_snail', ts: at('2009-11-30T18:00:00Z'), text: 'is the yellow suit a warning or a lifestyle' }, { by: 'the_turtle', ts: at('2009-12-01T18:00:00Z'), text: 'both' }] },
  ],
  guestbook: [
    { id: 'g1', by: 'jessica_88', ts: at('2009-03-14T23:52:00Z'), av: 1, text: 'omg pekko fixd my pc in like 2 hrs!!! ty ty ty!!! xoxo :)' },
    { id: 'g2', by: 'BigTony_MN', ts: at('2009-05-02T06:14:00Z'), av: 2, text: 'my printer works now. i dont know how. i dont care. 5 stars.' },
    { id: 'g3', by: 'grandma_rita', ts: at('2009-05-19T21:31:00Z'), av: 3, text: 'PEKKO FIXED MY PC!!!! now i can feed my virtual cows again!!!1' },
    { id: 'g4', by: 'mike_from_mantova', ts: at('2009-07-07T01:03:00Z'), av: 4, text: 'he told me 2 stop downloading "free" screensavers. he was right :( epic fail on my part' },
    { id: 'g5', by: 'kittylover2009', ts: at('2009-08-23T16:45:00Z'), av: 5, text: 'lol he found 4000 duplicate photos of my cat. all of them of my cat. kept 3999' },
    { id: 'g6', by: 'dave', ts: at('2009-10-12T10:10:00Z'), av: 6, text: 'i thought vista was a virus. pekko said "close enough"' },
    { id: 'g7', by: 'nerd4life', ts: at('2009-11-30T23:59:00Z'), av: 7, text: '10/10 would boot again. also he ate my salami. worth it. w00t' },
    { id: 'g8', by: 'raven_666', ts: at('2010-01-15T02:22:00Z'), av: 8, text: 'my pc had 47 toolbars. pekko removed 46. i kept one for the memories.' },
    { id: 'g9', by: 'PaoloPaolo', ts: at('2010-02-28T19:40:00Z'), av: 9, text: 'he came 2 my house in a yellow suit. printer got scared and started working' },
  ],
  shout: [
    { by: 'guest_1337', ts: at('2010-04-01T01:12:00Z'), text: 'is he there??' },
    { by: 'pekko', ts: at('2010-04-01T01:13:00Z'), text: 'yes. always. what did the computer do' },
    { by: 'sandra72', ts: at('2010-04-01T01:20:00Z'), text: 'hi pekko do u also fix toasters' },
    { by: 'pekko', ts: at('2010-04-01T01:21:00Z'), text: 'only if they run windows. kthxbai' },
  ],
})
