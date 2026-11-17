// “Chandler Fangirls Over James Bond’s Tux | Friends” (the official Friends channel, Best of Season 7): at Rachel's
// store Chandler is thrilled to get James Bond's tux for his wedding, until Ross shows up with "Batman's tux"; Chandler
// begs him not to wear it, and in the end the Batman tux turns out to be from a love-story premiere.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Rach (13.9 s), Monica (9.6 s, 21.9
// s), Rachel (112.5 s). Chandler and Ross are never named, so stems name them as the show does; no key depends on who
// speaks. The friend who tries on the jacket and reads the invitation (187–217 s) is never named: stems avoid him.
// Untested: 24.9–26.1 s (captions "don't try to blue pin me", garbled in both); 46.9 s ("Might I suggest", whisper
// "honey mine i suggest": no item turns on those words); 133.6 s ("it will" vs whisper "it'll"); 161.8–164.5 s and
// 171.5–175 s / 192–194 s (the "slept with my sister" / "double-O and seven" jokes: sexual, left out); 165–171 s (who
// says "mine doesn't fit" isn't clear); 200.5 s ("Holy double vented comfort, Batman": needs the TV show).
// EAR CHECK: 181.6 s s2 — "you're not gonna be" (whisper "gonna", captions "going to"); the item turns only on "not".
// REVIEW 2026-11-16: pass 11, fix 11, drop 1, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const bondtux: Clip = {
  id: 'bondtux', video: 'NDKy6QrWPCY', title: 'Chandler Fangirls Over James Bond’s Tux', dur: 238, wpm: 139,
  band: 'slow', tags: ['買い物', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // why: made new ← "the tuxedos that we make… make you a…" with "deal" lost (make = 作る); swap ← "deal" read as
    //   取引, with Monica's three picks named just after
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'deal', seg: [1.4, 8.3],
      stem: 'At the very start, what is Chandler offered on the tuxes?',
      choices: ['A lower price on any one he likes', 'A brand-new tux made to his size',
                'A swap for one Monica has picked'], a: 0,
      cue: '文の終わり、make you a のあとの一語。',
      line: 'if there’s anything that you like, we can *make you a deal*.',
      said: '「気に入ったものがあれば、お安くしますよ」と、どれでもいいと付け加える。',
      mean: 'make someone a deal ＝ 値段を特別にする。店でよく聞く言い方。',
      trap: 'make は「作る」なので「新しく作る」に引かれやすい。a のあとの名詞まで聞く。',
      use: 'Buy two and I’ll make you a deal.（2つ買うならまけますよ）' },

    // why: two / four ← "these are the" right before blurs the number; only the vowel and the r keep it apart
    { id: 'n1', skill: 'number', level: 'B1', point: 'three', seg: [8.1, 11.4], keep: true,
      stem: 'How many tuxes has Monica already approved?',
      choices: ['Two', 'Three', 'Four'], a: 1,
      cue: 'Monica の名前の直前の数。',
      line: 'But these are *the three* that Monica pre-approved.',
      said: '「でも Monica が事前に OK したのはこの3着」。',
      mean: 'pre-approved ＝ 事前に承認ずみ。選べる範囲は決まっている。',
      trap: 'these と three は出だしが似て、数を聞き落としやすい。th のあとの r を聞く。',
      use: 'These three are already approved.（この3つはもう承認ずみです）' },

    // why: a date ← "attend our wedding as my guest" heard as asking her out; a tux to sell ← "hooking me up" read
    //   as a sale still to come, not a favour done
    { id: 'h1', skill: 'humor', level: 'C1', point: 'guest', seg: [11.8, 24.4],
      stem: 'Why does the audience laugh at Chandler’s thank-you to Rachel?',
      choices: ['His “reward” is a place she already has',
                'He seems to ask her out just before his wedding',
                'He thanks her for a tux she still has to sell him'], a: 0,
      cue: '笑いのあと、Rachel が自分の役目を言う一言。',
      line: 'I want you to *attend our wedding as my guest*. — I’m *Monica’s maid of honor*.',
      said: 'お礼に「僕の客として式に招待する」と言うと、「私、花嫁の付き添い役よ」と返される。',
      mean: '大きなお礼のつもりが、彼女はもっと大事な役で出席する。何もあげていない。',
      trap: 'as my guest を誘いと取りやすい。お礼の中身と相手の立場を比べる。',
      use: 'Thanks so much. Lunch is on me.（本当にありがとう。お昼はおごるよ）' },

    // why: sell back ← "make you a deal" a moment ago (a price word); loan ← the tuxes sit in the store, so a lend-out
    //   story fits what is seen
    { id: 'd1', skill: 'detail', level: 'B1', point: 'sendback', seg: [30.6, 36.9],
      stem: 'Once the celebrities are done with the tuxes, what do they do?',
      choices: ['They just send them back', 'They sell them back cheaply', 'They loan them to the store'], a: 0,
      cue: 'done with them のすぐあと。',
      line: 'when they’re done with them, they *just send them back*.',
      said: '「有名人用に作って、使い終わったら送り返してくるの」と説明する。',
      mean: 'send back ＝ 送り返す。だから店に、有名人が着たタキシードがある。',
      trap: 'deal が残ると「安売り」を作りやすい。done with them のあとの動詞を聞く。',
      use: 'Can I send it back if it doesn’t fit?（合わなかったら返品できますか）' },

    // R drop: t1 — blind 70 %: the title (“Fangirls”) answers it, and i1 turns on the same moment; never shipped.

    // R fix: blind 55 % (the title points to the key). All three choices now share "far too into…", with the
    //   targets a partial listener builds from the imitation ("You look fabulous" → vanity) and from “watching… less”.
    // why: how he looks ← his "You look fabulous" imitation heard as vanity; TV in general ← "watching… less" taken as
    //   'less TV', missing that she asks for *more* ESPN
    { id: 'i1', skill: 'infer', level: 'C1', point: 'espn', reveals: ['oneill'], seg: [39.5, 52.8],
      stem: 'What is Rachel hinting about Chandler with her TV advice?',
      choices: ['He is far too into celebrity news', 'He is far too into how he looks',
                'He is far too into TV in general'], a: 0,
      cue: '直前の、レッドカーペットのまねとのつながり。',
      line: 'Might I suggest watching a little *more ESPN* and a little *less E*?',
      said: '「スポーツ番組を少し増やして、芸能番組を少し減らしたら？」と言う。',
      mean: 'E は芸能ニュースの局。有名人の話に夢中な彼を軽くからかう。',
      trap: 'fabulous で見た目、less で「TV を減らせ」と取りやすい。何と何の比較かを聞く。',
      use: 'Might I suggest a little less coffee?（コーヒー、少し控えたら？）' },

    // why: actor ← "plays" read as playing a role; news anchor ← Tom Brokaw, named just before, is a newsman
    { id: 'd2', skill: 'detail', level: 'B1', point: 'oneill', seg: [60.4, 70.4],
      stem: 'Who is the second celebrity, according to Rachel?',
      choices: ['A player on a sports team', 'An actor in a TV series', 'A news anchor on TV'], a: 0,
      cue: 'Who’s that? への答え。',
      line: 'He *plays for the Yankees*. Seriously, ESPN.',
      said: '「誰？」に「ヤンキースの選手。本気でスポーツ番組を見て」。',
      mean: 'play for ＋ チーム ＝ そのチームでプレーする。役を演じるのは play ＋ 役名。',
      trap: 'plays だけ聞くと俳優を思い浮かべやすい。play のあとの for が目印。',
      use: 'My brother plays for a local team.（兄は地元のチームでプレーしてる）' },

    // why: back seat ← background read as "the back"; seriously ← "Seriously" heard as "watch it seriously"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'background', seg: [68.6, 74.4],
      stem: 'What does Rachel tell Chandler to do with the sports channel?',
      choices: ['Leave it playing while he does other things', 'Watch it from the back while others choose',
                'Watch it closely and learn the players'], a: 0,
      cue: 'アドバイスの最後の一文、in the のあと。',
      line: '*Have it on in the background*.',
      said: '「見なくていいから、つけておいて」と付け足す。',
      mean: 'have it on ＝ つけておく。in the background ＝ 何かしながら流す。',
      trap: 'background を「後ろの席」と取ると場所の話になる。have it on とセットで聞く。',
      use: 'I like music on in the background.（音楽を流しながらが好き）' },

    // anchor: 69.1–73.2 s each step asks for less: "Seriously, ESPN." → "Just once in a while." → "Have it on in the
    //   background." (watching → sometimes → not even watching)
    // why: often ← "Seriously" taken as a firm, full demand (literal hedge reversed); both on ← "in the background"
    //   R fix: was "keep your shows, but put sports on too", which "have it on in the background" can defend (K1).
    //   swap ← "Seriously, ESPN" heard as a firm switch-over order (the hedges after it lost)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'background', reveals: ['while'], seg: [68.6, 74.4],
      stem: 'Which plain-English version keeps what Rachel means here?',
      choices: ['“Even a tiny bit of sports would help you.”',
                '“You need to watch sports often, and properly.”',
                '“Swap your shows for sports, starting today.”'], a: 0,
      cue: '3つの文で、頼む量がどう変わるか。',
      line: 'Seriously, ESPN. Just *once in a while*. *Have it on in the background*.',
      said: '「本気で、スポーツ。たまにでいい。流すだけでいい」と、一文ごとに要求を下げる。',
      mean: '要求を下げ続けるのは「それすらしてないでしょ」というからかい。下げるほど彼がひどく聞こえる。',
      trap: 'Seriously を強い命令と取りやすい。要求が下がり続けたら、本気の指示より冗談を疑う。',
      use: 'Just one vegetable. Once a week. Please.（野菜1つでいい。週1でいいから）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'while', seg: [71.3, 74.4],
      stem: 'Type what Rachel says: “Just ___.” (4 words)', answer: 'once in a while',
      cue: 'Seriously, ESPN のすぐあと。',
      line: 'Just *once in a while*.',
      said: '「たまにでいいから」と、スポーツ番組を勧める。',
      mean: 'once in a while ＝ ときどき、たまに。4語が「ワンスイナワイル」とつながる。',
      trap: 'once の s と in、in と a がつながって1語に聞こえやすい。a も弱く短い。',
      use: 'I cook once in a while.（たまに料理するよ）' },

    // R fix: blind 65 % ("moves on to the price" was a filler). Now the two misreadings of "not just that" face the key.
    // why: that's all ← "it's not just that" read as "it's just that" (just = だけ, 'only cool'); not cool ← "not"
    //   caught, "just" lost
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'notjust', seg: [89.6, 94.6],
      stem: 'When the tux is called “pretty cool”, what does Chandler’s reply do?',
      choices: ['Says “cool” is far too small a word', 'Says the tux is cool, and that’s all',
                'Says the tux isn’t all that cool'], a: 0,
      cue: '返事の最初の短い一文と、そのあとの大きな話。',
      line: 'Ah, *it’s not just that*. I would be England’s most powerful weapon.',
      said: '「それだけじゃない。僕はイギリス最強の武器だ」とボンド気分で語る。',
      mean: 'It’s not just that ＝ それどころじゃない。相手の言葉に上乗せする。',
      trap: 'not で反対意見に取りやすい。not just なら「それだけじゃない」。',
      use: 'It’s not just good. It’s amazing.（いいなんてもんじゃない、最高だよ）' },

    // R fix: blind 55 % ("won't be the only one" spelled out the problem; the date choice was weak). The key is now
    //   plain, and the date choice uses "hooked me up" (also 'set up on a date') right after the date joke.
    // why: wants Bond's ← "James Bond's tux" is said in the fight, in the wrong relation; a date ← "a freakishly thin
    //   date" then "Rachel hooked me up", and hook up can mean 'set up on a date'
    { id: 'g1', skill: 'gist', level: 'B2', point: 'clash', reveals: ['lessspecial'], seg: [105.0, 165.0],
      stem: 'What problem does Ross’s news create for Chandler?',
      choices: ['Ross will wear a star’s tux too', 'Ross wants to wear the Bond tux',
                'Rachel set Ross up with a date'], a: 0,
      cue: '二人がそれぞれの tux を言い合うところ。',
      line: 'if you wear that, it’ll make *mine less special*.',
      said: 'Ross も有名人のタキシードを着ると知り、Chandler は着ないでくれと頼み込む。',
      mean: '自分だけの特別なタキシードが、特別でなくなるのが問題。',
      trap: 'date の直後の hooked me up をデートの紹介と取りやすい。No のあとが本題。',
      use: 'That kind of takes the shine off mine.（それだと私のが目立たなくなるな）' },

    // R fix: blind 50 %. "Bought it as his wedding gift" was muddled (whose wedding?); now the 'connected him with a
    //   place' reading of hook up.
    // why: hung it up ← hook = フック (hung on a hook); rent ← hook up with = 'put him in touch with' a shop
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'hookup', seg: [111.8, 118.0],
      stem: 'What did Rachel do about Ross’s tux?',
      choices: ['She arranged for him to get it', 'She hung it up for him at the store',
                'She sent him to a shop to rent it'], a: 0,
      cue: 'Rachel の名前のすぐあとの動詞。',
      line: 'No, Rachel *hooked me up* with a tux, but not just any tux…',
      said: '「Rachel が手配してくれた。それもただのじゃない」。',
      mean: 'hook someone up with ～ ＝ ～を手配してあげる。くだけた言い方。',
      trap: 'hook を「フックにかける」と取るとハンガーの話になる。人＋up＋with で「手配」。',
      use: 'Can you hook me up with a ticket?（チケット、なんとかならない？）' },

    // why: especially ← the word learners know best, same stress and ending; specially / exactly ← share "-ly" and the
    //   s–k cluster
    { id: 's1', skill: 'sound', level: 'B2', point: 'expressly', seg: [118.7, 125.0],
      stem: 'Fill the gap: “Made ___ for Val Kilmer…”',
      choices: ['especially', 'expressly', 'exactly', 'specially'], a: 1,
      cue: 'Made のすぐあと、ex で始まる語。',
      line: 'Made *expressly* for Val Kilmer and worn by him in the hit film…',
      said: '「ヴァル・キルマーのために特別に作られた」と自慢する。',
      mean: 'expressly ＝ そのためだけに。especially より改まった言い方。',
      trap: 'especially はよく聞く語なので引かれやすい。expressly は真ん中に「プレ」がある。',
      use: 'This was made expressly for you.（これはあなたのためだけに作ったの）' },

    // R fix: blind 55 % ("quiz Chandler" was a filler). Now the vagueness read as 'he never saw it'.
    // why: never seen it ← the vague "that Batman film he was in" taken as an admission; wrong actor ← "Val Kilmer… that Batman film" heard as
    //   doubt about who wore it
    { id: 'h2', skill: 'humor', level: 'C1', point: 'hitfilm', seg: [118.7, 128.9],
      stem: 'Why does Ross’s grand description of the tux get a laugh?',
      choices: ['He builds it up, then can’t name the film',
                'He admits he has never seen the film',
                'He mixes up which actor wore the tux'], a: 0,
      cue: 'hit film のあと、言い直す部分。',
      line: 'worn by him in the hit film… *that Batman film he was in*.',
      said: '「大ヒット映画で着た…あの、彼が出てたバットマンの映画で」と、題名が出てこない。',
      mean: '大げさに語り出したのに、肝心の題名があいまい。自慢と中身の落差が笑い。',
      trap: 'あいまいさを「見ていない」と取りやすいが、そうは言っていない。言い直しは物忘れの合図。',
      use: 'You know, that movie with the dog in it.（ほら、犬が出てたあの映画）' },

    // R fix: blind 60 % ("odd in the photos" was weak). Now "Batman and Bond" side by side, both said in the segment.
    // why: clash ← "Batman's tux" and "James Bond's tux" named one after the other; Monica's three ← "pre-approved"
    //   earlier
    { id: 'd3', skill: 'detail', level: 'B1', point: 'lessspecial', seg: [128.5, 135.9],
      stem: 'Why doesn’t Chandler want Ross to wear his tux?',
      choices: ['It would make his own tux less special', 'Batman and Bond would clash side by side',
                'It isn’t one of the tuxes Monica approved'], a: 0,
      cue: 'Ross の So? への答え。',
      line: 'So, if you wear that, it’ll make *mine less special*.',
      said: '「君がそれを着たら、僕のが特別じゃなくなる」と理由を言う。',
      mean: 'mine ＝ 僕のタキシード。理由はただ、自分が目立てなくなること。',
      trap: 'Batman と Bond が並ぶので「合わない」と考えやすい。理由は So? のすぐあとの答えで聞く。',
      use: 'If everyone gets one, it’s less special.（みんな持ってたら特別じゃない）' },

    // anchor: 132.4 s "So?" (he shrugs the request off), then the speech never offers to give anything up; 150.2 s
    //   Chandler answers it with "Please don't take away my cool thing"
    // R fix: blind 60 %. The key is now concrete ("isn't giving up his own tux"), against the near miss that he
    //   wants Chandler's Bond tux; the weak "doubts the love" choice is gone.
    // why: Bond tux ← "James Bond's tux" said just before, read as Ross wanting it; envies ← the
    //   Japanese frame: talk of a friend's marriage heard as 羨ましい
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'speech', reveals: ['lessspecial'], seg: [128.5, 153.0],
      stem: 'When Ross talks about “the most special thing of all”, what is he not saying?',
      choices: ['That he isn’t giving up his own tux', 'That he’d rather have the Bond tux himself',
                'That he envies Chandler for getting married'], a: 0,
      cue: 'Ross の So? と、そのあと何も譲らない話し方。',
      line: 'Hello, you have *the most special thing of all*. You are marrying the woman you love.',
      said: '「何言ってるんだ、君には最高に特別なものがある。愛する人と結婚するんだから」と説く。',
      mean: 'いい話で相手の願いを小さく見せ、自分は何も譲らない。正論の形で「僕は脱がないよ」と言っている。',
      trap: 'Bond の話のあとなので、それが欲しいと取りやすい。立派な話のあと、その人が何を手放したかを見る。',
      use: 'Money isn’t everything. So, my turn to pick.（お金がすべてじゃない。じゃ、僕が選ぶね）' },

    // why: giving in ← he repeats "Pretty please?", heard as a soft echo before a yes; hurt ← the begging heard as
    //   Chandler refusing to share
    { id: 't2', skill: 'attitude', level: 'C1', point: 'pretty', seg: [149.7, 156.6],
      stem: 'How does Ross answer Chandler’s begging?',
      choices: ['He teases him for being so uncool', 'He softens and starts to give in',
                'He sounds hurt that Chandler won’t share'], a: 0,
      cue: '同じ言葉をくり返したあとの、短い一言。',
      line: 'Pretty please? *Not very 007*.',
      said: '「pretty please？007らしくないね」と返す。',
      mean: 'pretty please は子どものおねだり。ボンドとは正反対だと、からかっている。',
      trap: 'くり返しは同情にも聞こえる。そのあとに相手の弱点をつく一言が来たら、からかい。',
      use: 'Begging? Not very cool.（おねだり？かっこ悪いね）' },

    // why: apologizing ← "Look, it's my wedding day, okay?" heard as 申し訳なさ (the Japanese frame); stressed ←
    //   "Look, … okay?" heard as 'I'm too worn out for this'
    // R fix: blind 65 %. "Moving the talk away" became "too stressed to keep arguing" ("Look, … okay?" as fed-up).
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'weddingday', seg: [157.3, 163.6],
      stem: 'What is Chandler doing with “Look, it’s my wedding day, okay?”',
      choices: ['Using his big day to make Ross give in', 'Saying sorry for asking Ross so much',
                'Saying he’s too stressed to keep arguing'], a: 0,
      cue: 'そのあとの If you were… の文。',
      line: 'If you were getting married, *I would never do anything to upset you*.',
      said: '「僕の結婚式の日だよ。君が結婚するなら、僕は君を困らせることは絶対しない」と言う。',
      mean: '特別な日を盾にして、相手が断りにくい形で頼んでいる。',
      trap: 'Look, … okay? は謝罪や疲れにも聞こえるが、続くのは相手に求める話。',
      use: 'Come on, it’s my birthday.（ねえ、今日は私の誕生日だよ）' },

    // why: you're gonna ← "not" is short and unstressed after "you're"; you were ← "you're" heard as "you were"
    { id: 's2', skill: 'sound', level: 'B2', point: 'notgonna', seg: [180.9, 185.2],
      stem: 'Fill the gap: “Does that mean ___ gonna be wearing yours?”',
      choices: ['you’re', 'you’re not', 'you were', 'you weren’t'], a: 1,
      cue: 'Does that mean のすぐあと、短い2語。',
      line: 'Does that mean *you’re not* gonna be wearing yours?',
      said: '「じゃあ、君は自分のを着ないってこと？」と確かめる。',
      mean: 'you’re は「ヨア」と短く、not も弱い。それでも t の止まる音が残る。',
      trap: 'not が弱いと肯定に聞こえ、意味が逆になる。you’re と you were は母音の数で聞き分ける。',
      use: 'So you’re not coming tonight?（じゃあ今夜は来ないの？）' },

    // R fix: blind 50 % ("too small for Val Kilmer too" was weak). Now "didn't wear" + "Val Kilmer" heard as
    //   'someone else wore it'.
    // why: another actor ← "Val Kilmer didn't wear this" heard without "in Batman"; must go back ← "they just send them
    //   back" from the store scene
    { id: 'g2', skill: 'gist', level: 'B2', point: 'twist', seg: [205.3, 227.6],
      stem: 'What does the invitation in the pocket turn out to mean?',
      choices: ['The tux was never worn in the Batman film', 'The tux was worn by another actor',
                'The tux was only lent and must go back'], a: 0,
      cue: 'Oh my god のあとの一文。',
      line: 'Val Kilmer *didn’t wear this in Batman*.',
      said: '招待状が出てきて、バットマンの映画では着ていなかったと分かる。',
      mean: '自慢の「バットマンのタキシード」が、ただの別の場で着た服だった、という落ち。',
      trap: 'didn’t wear だけだと「別人が着た」と取りやすい。in Batman まで聞く。',
      use: 'Turns out it wasn’t real after all.（結局、本物じゃなかったんだ）' },

    // why: excited ← "premiere" sounds glamorous; unsure ← "some" heard as "I don't know which"
    { id: 't3', skill: 'attitude', level: 'C1', point: 'tutti', reveals: ['twist'], seg: [206.9, 218.0],
      stem: 'What does the friend reading the invitation think of that film?',
      choices: ['He looks down on it as a sappy romance', 'He is excited the tux went to a premiere',
                'He is unsure which film it really was'], a: 0,
      cue: 'love story の直前の、変わった言葉。',
      line: 'the premiere of *some tutti-frutti love story* where he played a blind guy.',
      said: '「どこかの甘ったるい恋愛映画の試写会で着た」と読み上げる。',
      mean: 'some ＋ 名詞で「どうでもいい何かの」。tutti-frutti で甘さを笑う、見下した言い方。',
      trap: 'premiere は華やかでも言い方は冷たい。この some は「不明」より軽蔑。',
      use: 'Some silly show about cooking.（料理のくだらない番組）' },

    // R fix: blind 60 % ("smells from years in a storeroom" was weak). Now the 'smells nice' reading of sense of smell.
    // why: smells nice ← "sense of smell" taken as how the tux smells; mocks the actor ← right mechanism, wrong target: the
    //   blind role, not the tux, heard as the butt
    { id: 'i2', skill: 'infer', level: 'C1', point: 'smell', reveals: ['twist'], seg: [214.1, 227.4],
      stem: 'What does the last line say about the tux now?',
      choices: ['Its “power” is a blind man’s, not Batman’s', 'Its only perk is that it smells nice',
                'It makes fun of the actor’s blind role'], a: 0,
      cue: '直前の blind guy とのつながり。',
      line: 'The only *superpower* you have is a *slightly heightened sense of smell*.',
      said: '「君の唯一の超能力は、ちょっと鼻がきくことだけだな」と言う。',
      mean: 'バットマンの力どころか、目の見えない役の「鼻がいい」程度。tux の格が一気に下がった。',
      trap: 'smell を服のにおいと取りやすい。においを感じる力のこと。blind guy と結ぶ。',
      use: 'My only talent is finding parking.（私の特技は駐車場を見つけることだけ）' },
  ]
};
