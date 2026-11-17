// REVIEW 2026-11-16: pass 4, fix 16, drop 0, new 0; ear checks 0
// OPEN: a cold blind re-read still gets h3 at 70 % (Joey's robot co-star, from show knowledge); kept, since a
//   viewer who knows the show gets no more from the words than one who doesn't.
// “Joey Thinks He Shouldn't Have to Audition | Friends” (the official Friends channel, Best of Season 7): Joey greets
// Terry like an old colleague, expects to be offered the part of Striker, learns he has to audition like everybody,
// bluffs with his cable show, and storms into a comeback about hoops that never gets finished.
// Segments from the captions, words from whisper (2026-11-16). Joey and Terry are named in the audio ("Hey, Terry",
// "I'm sorry, Joey").
// Untested on purpose: 9.8 s (captions "Duh", whisper "So"), the role's name at 11.6 s (spelling, trivia), and
// 76–87 s (whisper loops "this is a star that the hoop"; the captions end at 75.4 s).
// EAR CHECK: none (every key rests on words both sources agree on)
import type { Clip } from '../types.ts';

export const joeyHoops: Clip = {
  id: 'joeyhoops', video: 'fjq7zU7u_Mg', title: 'Joey Thinks He Shouldn\'t Have to Audition', dur: 87, wpm: 191,
  band: 'fast', tags: ['職場', 'お願い・断り'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2, blind 60 % (the title points at the stand-off). Each choice is now half right: Terry's "won't budge"
    //   is in two, and Joey's refusal is in two.
    // why: reads after all ← the usual end of a stand-off ("rules are rules", then he gives in); shorter audition ←
    //   the bargaining script, and Joey does refuse
    { id: 'g1', skill: 'gist', level: 'B2', point: 'arc', reveals: ['sorry', 'hoop'], seg: [0, 76.3],
      stem: 'How does the meeting between Joey and Terry end up?',
      choices: ['Terry won’t budge, and Joey won’t read the scenes',
                'Terry won’t budge, so Joey reads the scenes after all',
                'Terry offers a shorter audition, but Joey refuses'], a: 0,
      cue: 'Terry の返事の固さと、Joey の最後の言葉。',
      said: '役をもらえるつもりの Joey は、全員オーディションだと言われ、読まずに文句で言い返す。',
      mean: 'Terry は決まりを曲げず、Joey も条件をのまない。平行線の場面。',
      trap: '言い合いの場面は「どちらかが折れる」形を予想しやすいが、ここは誰も折れない。',
      use: 'Sorry, rules are rules.（ごめん、決まりは決まりなんだ）' },

    // R fix: V2/K6, blind 50 %. The key's scare quotes ("remembering") marked it. Reworded without them.
    // why: ego ← "look smaller" heard as "you've grown big" (a big head); embarrassed ← "a different building" heard
    //   as Terry apologising for a smaller office
    { id: 'h1', skill: 'humor', level: 'C1', point: 'halls', seg: [0, 9.3],
      stem: 'Why does the reply to Joey’s remark about the halls get a laugh?',
      choices: ['Joey’s fond memory is of some other building',
                'Terry hints that Joey’s ego has grown since then',
                'Terry is embarrassed that the new place is so small'], a: 0,
      cue: '懐かしそうな一言に、Terry が短く返すところ。',
      line: 'These halls look *smaller than they used to*. — It’s *a different building*.',
      said: '「この廊下、昔より狭く感じるね」としみじみ言うと、「建物が違うよ」と返される。',
      mean: '大物ぶって昔を懐かしんだのに、その「昔」は別の建物。かっこつけが空振り。',
      trap: 'smaller から「天狗」の話と深読みしやすいが、返事は事実の訂正だけ。',
      use: 'Wait, this isn’t the same place?（あれ、ここ同じ場所じゃないの？）' },

    // R fix: V2, blind 60 %. The key was the centre of the set (do + want + me in 3 of 4). The new set is balanced,
    //   and "need me to" is the job-interview line.
    // why: do you want to ← "me" is short and swallowed after "want"; did you want to ← do/did blur and "me" is
    //   lost; need me to ← the set job question "When do you need me to start?"
    { id: 's1', skill: 'sound', level: 'B2', point: 'start', seg: [13.3, 16.55],
      stem: 'Fill the gap: “When ___ start?”',
      choices: ['do you want me to', 'do you want to', 'did you want to', 'do you need me to'], a: 0,
      cue: 'want のあと、短くつながる音。',
      line: 'When *do you want me to* start?',
      said: '「いつから始めればいい？」と Joey が聞く。',
      mean: 'want me to が「ワンミタ」とつながる。me は弱いが、自分が始める話なので要る。',
      trap: 'me が飲みこまれて want to に聞こえやすい。誰が始めるかで判断する。',
      use: 'When do you want me to come by?（いつ寄ればいい？）' },

    // why: asking why ← "Why don't we…" read word by word as a why-question (なぜ～しないのか); putting off ←
    //   "start" heard, but "right now" lost
    { id: 'pw', skill: 'pragma', level: 'B1', point: 'whydont', seg: [13.3, 17.3],
      stem: 'When Joey asks when to start, what is Terry’s reply doing?',
      choices: ['Suggesting they begin right away', 'Asking why Joey hasn’t begun yet', 'Putting off the start until later'],
      a: 0,
      cue: 'Terry の返事の最後の二語。',
      line: '*Why don’t we* start *right now*?',
      said: '「じゃあ、今から始めようか」と答え、Joey は「オーケー」と返す。',
      mean: 'Why don’t we ～? ＝「～しようよ」という提案。理由は聞いていない。',
      trap: 'why を「なぜ」と文字通りに取ると、理由を聞いているように聞こえる。we と組なら提案。',
      use: 'Why don’t we grab lunch?（お昼食べに行かない？）' },

    // R fix: V2, blind 75 % (the title says "audition"). The key was the only audition choice; a second one, the
    //   audition times, is added.
    // why: script ← the first thing an actor gets for a part; audition times ← "audition" caught, "scenes" lost
    { id: 'd4', skill: 'detail', level: 'B1', point: 'scenes', seg: [17.3, 20.3],
      stem: 'What does Terry say he is giving Joey?',
      choices: ['The scenes for the audition', 'The script for the first episode', 'The list of audition times'], a: 0,
      cue: '「Here are」のあと。',
      line: 'Here are *the audition scenes*.',
      said: '「これがオーディション用のシーンだよ」と渡す。',
      mean: 'audition scenes ＝ オーディションで読む場面の台本。まだ役は決まっていない。',
      trap: 'audition だけ拾うと日程表とも取れる。最後の scenes まで聞く。',
      use: 'Here are the forms you need to fill out.（記入する書類はこちらです）' },

    // R fix: V2, blind 75 %. "Teasing" was weak. The new distractor reads the question as doubt about Joey; the
    //   segment's "Everybody has to audition" refutes it.
    // why: forgotten ← Joey goes on to remind him of his old role; wrong for it ← "Why would you think that?" heard
    //   as doubt about Joey himself
    { id: 'i3', skill: 'infer', level: 'B2', point: 'think', seg: [23.7, 37.4],
      stem: 'When Joey says he expected an offer, what does Terry’s reply show?',
      choices: ['That nobody had ever promised Joey the part', 'That Terry has forgotten Joey’s earlier work',
                'That Terry doesn’t think Joey suits the part'], a: 0,
      cue: 'Terry の短い問い返しと、少しあとの一言。',
      line: 'Thought you were going to offer me the part. — *Why would you think that?*',
      said: '「役をくれると思ってた」に対し、「どうしてそう思ったの？」と聞き返す。',
      mean: '約束した覚えはない、という問い返し。このあと「全員オーディション」と続く。',
      trap: 'Joey が昔の役を説明するので「忘れていた」に見えるが、Terry は理由を聞いているだけ。',
      use: 'Why would you think that?（なんでそう思ったの？）' },

    // R fix: V2, blind 50 %. "Why wouldn't you think that?" is unnatural, so it was easy to rule out. Cut to three.
    // why: did ← "would" shrinks to "wd" and only the d is left; do ← the plain present is what learners expect
    { id: 's2', skill: 'sound', level: 'B2', point: 'think', seg: [24.9, 31.4],
      stem: 'Fill the gap: “___ think that?”',
      choices: ['Why would you', 'Why did you', 'Why do you'], a: 0,
      cue: 'Why のすぐあと、二語がつながる。',
      line: '*Why would you* think that?',
      said: '「どうしてそう思うわけ？」と聞き返している。',
      mean: 'would you が「ウッジュ」のようにつながる。would は弱く、ほぼ「ウd」。',
      trap: 'd だけが残るので did に聞こえやすい。did なら「ディ」の母音がはっきり出る。',
      use: 'Why would you say that?（なんでそんなこと言うの？）' },

    // why: same character ← "Dr. Drake…" sounds like the same role, and "who looks more like me" seems to say it;
    //   written for him ← the usual actor's boast, and it fits "offer me the part"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'twin', seg: [27.3, 34.2],
      stem: 'Why did Joey expect to be offered the part?',
      choices: ['He had played the character’s twin brother', 'He had played the same character before',
                'He had been told the part was written for him'], a: 0,
      cue: '「Well, I was」のあと、役名に続く語。',
      line: 'I was Dr. Drake Ramoray, *Striker’s twin brother*.',
      said: '「僕はドレイク役だった。ストライカーの双子の兄弟だよ」と言う。',
      mean: '前に演じたのは別の役。でも双子だから同じ顔、だから自分が適役、という理屈。',
      trap: '役名が似ているので「同じ役」と取りやすい。twin brother が聞こえたら別人の役。',
      use: 'I used to play his brother on TV.（昔テレビで彼の兄弟役をやってた）' },

    // anchor: 30.0–30.6 s "Striker's twin brother" just before; 32.1–33.4 s "Who looks more like me than me, right?":
    //   a twin looks like the other twin, so the "me" he means is Striker's face
    // why: literal ← the words taken in order ("more like me than me"); now vs then ← "used to" earlier in the clip,
    //   and "looks more like" read as a change over time
    { id: 'c1', skill: 'infer', level: 'C2', point: 'looks', reveals: ['twin'], seg: [27.3, 34.2],
      stem: 'Which plain-English version keeps what Joey means by “more like me than me”?',
      choices: ['“No one could look more like Striker than I do.”', '“Striker looks more like me than I look myself.”',
                '“I look more like Striker now than I did back then.”'], a: 0,
      cue: '直前の「双子」と、この一言のつながり。',
      line: 'Striker’s twin brother. — *Who looks more like me than me*, right?',
      said: '「双子の兄弟役だったんだ。僕より僕に似てるやつなんていないだろ？」と言う。',
      mean: '双子なら同じ顔。だからストライカーに一番似ているのは自分、と言いたい。言葉がこんがらがって「僕より僕」になった。',
      trap: '語順どおりに訳すと意味が通らない。言いそこないは、直前の話から言いたいことを組み立てる。',
      use: 'Nobody knows this job better than me.（この仕事を一番わかってるのは私）' },

    // R fix: V2, blind 80 % (the title says it). Two of the choices now start with "Everybody", and "has to" against
    //   "has done" is the near sound.
    // why: has done ← "has to" (hasta) heard as "has" + a past participle; most actors ← the softer rule a star
    //   expects, and "every-" lost
    { id: 'd2', skill: 'detail', level: 'B1', point: 'everybody', seg: [34.4, 37.6],
      stem: 'Right after “…than me, right?”, what is said about auditions?',
      choices: ['Everybody has to do one', 'Everybody else has done one', 'Most actors have to do one'], a: 0,
      cue: '少し間があいたあとの短い一文、最初の語。',
      line: '*Everybody* has to audition.',
      said: '「オーディションは全員受けるんだ」と言われる。',
      mean: 'everybody ＝ 例外なし。前に出ていた俳優でも同じ、ということ。',
      trap: 'has to は「ハスタ」とつながり、has done にも聞こえる。主語と has to を聞く。',
      use: 'Everybody has to show their ticket.（全員チケットを見せてください）' },

    // R fix: V2/K7, blind 75 %. The key was the only two-part, nuanced choice. All three are short now, and the new
    //   distractor ("not keen") is the surface reading.
    // why: turning it down ← "don't need to do this" read as a polite no (遠慮); not keen ← "don't really need" taken
    //   at face value
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'need', reveals: ['series'], seg: [39.0, 45.4],
      stem: 'What is Joey doing when he tells Terry “I don’t really need to do this”?',
      choices: ['Hinting he could just walk away', 'Turning the part down politely', 'Saying he’s not keen on the part'],
      a: 0,
      cue: '続けて自慢するものと、そのあとの返事。',
      line: 'I don’t *really need to do this*. I got *my own cable TV series*.',
      said: '「別にこんなことしなくていいんだ。自分のケーブルの番組があるし」と言う。',
      mean: '断るのではなく「他にもあるぞ」と強気に出て、オーディションなしを狙う駆け引き。',
      trap: '「結構です」のような丁寧な辞退に取りやすいが、断ってはいない。自慢が続くのが合図。',
      use: 'I don’t need this, you know.（別に困ってないんだけどね）' },

    // R fix: V2, blind 55 %. Every choice is now a TV show, so it turns on "my own" and "cable".
    // why: a part ← "my own" lost and "cable TV series" caught; network ← "my own… series" caught and "cable" lost
    { id: 'd3', skill: 'detail', level: 'B1', point: 'series', seg: [42.4, 45.4],
      stem: 'What does Joey say he already has?',
      choices: ['His own cable TV series', 'A part in a cable TV series', 'His own show on a big network'], a: 0,
      cue: '「I got」のあと、続く数語。',
      line: 'I got *my own cable TV series*.',
      said: '「自分のケーブルテレビの番組がある」と言う。',
      mean: 'my own ～ ＝ 自分だけの。主役の番組を持っている、という自慢。',
      trap: 'my own を聞き逃すと「出演」に聞こえる。my own と cable の両方を聞く。',
      use: 'I have my own room now.（もう自分の部屋があるんだ）' },

    // R fix: K1. "It admits the series isn't only his own show" could be defended: "with a robot" does mean he shares
    //   it. It's replaced by a clear overreading.
    // why: robot star ← "with a robot" read as the robot being the draw; big-budget ← a robot sounds like
    //   expensive effects
    { id: 'h3', skill: 'humor', level: 'C1', point: 'robot', reveals: ['series'], seg: [42.4, 48.6],
      stem: 'Why does the short add-on after Joey’s boast get a laugh?',
      choices: ['It makes his boast sound silly, not impressive', 'It admits a robot is the real star of the show',
                'It hints the show is a big-budget hit'], a: 0,
      cue: '自慢のあと、間をおいて足される二語。',
      line: 'I got my own cable TV series. … *With a robot.*',
      said: '「自分の番組があるんだ」のあと、少し間をおいて「ロボットと一緒の」と足される。',
      mean: '大物らしい自慢が、付け足しで急に子どもっぽくなる。落差が笑い。',
      trap: 'with a robot の中身を深読みしやすい。笑いは、自慢が小さくなる点。',
      use: 'I have a car. Well, a scooter.（車があるんだ。まあ、スクーターだけど）' },

    // R fix: V2, blind 85 %. The key was the only balanced choice. All three are now "X, but/and Y".
    // why: bending later ← "I'm sorry" read as a real apology (日本語の「すみません」= 譲歩); hostile ← a short, flat
    //   answer heard as cold
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'sorry', seg: [48.5, 52.3],
      stem: 'How does Terry come across when he answers Joey?',
      choices: ['Kind, but firm that the rule stands', 'Sorry, and open to bending it later', 'Polite, but quietly hostile to Joey'],
      a: 0,
      cue: '名前を呼んだあとの一文。',
      line: 'I’m sorry, Joey. *That’s the way it is.*',
      said: '「悪いね、Joey。そういう決まりなんだ」と言う。',
      mean: 'I’m sorry は気づかいの前置き。中身は「変えられない」という、はっきりした断り。',
      trap: '日本語の「すみません」は譲る前ぶれにもなるが、英語の sorry のあとは断りが多い。',
      use: 'I’m sorry, but that’s our policy.（申し訳ありませんが、規則でして）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'sorry', seg: [48.6, 52.3],
      stem: 'Type what Terry says after “I’m sorry, Joey.” (5 words)', answer: "that's the way it is",
      cue: 'Joey のあと。最初の語は二回聞こえても一回で。',
      line: 'I’m sorry, Joey. *That’s the way it is*.',
      said: '「そういうものなんだ」。That’s は言いなおしで二回聞こえる。',
      mean: '決まりだから仕方ない、の決まり文句。way it is がつながり「ウェイイティズ」。',
      trap: 'it is が弱く短く、語の数を数えにくい。',
      use: 'It’s not fair, but that’s life.（不公平だけど、そういうもんだよ）' },

    // R fix: V2, blind 70 %. "Praise" was weak. The new distractors are a last push for the part, and the "huh?"
    //   read as joking.
    // why: push for the part ← the bargaining script, and he never gets the part; joke ← "huh?" and "pretty special"
    //   heard as friendly teasing
    { id: 'g2', skill: 'gist', level: 'B2', point: 'rant', reveals: ['special'], seg: [52.3, 76.3],
      stem: 'What is Joey’s long speech at the end meant to do?',
      choices: ['Tell Terry off for making stars audition', 'Push Terry to give him the part after all',
                'Joke with Terry to ease the tension'], a: 0,
      cue: '長い間のあと、Joey が言い出すこと全体。',
      said: '長い間のあと、Joey は Terry の立場や建物、スターの扱いに文句を言う。',
      mean: '頼みが通らなかったので、最後は捨てぜりふで言い返そうとしている。',
      trap: 'huh? や special は冗談にも聞こえるが、相手を責める言い方。話の向きをつかむ。',
      use: 'Who do you think you are?（何様のつもり？）' },

    // R fix: V2, blind 65 %. "Truly impressed" was weak. The new distractor shares the key's hurt but reads it as
    //   a plea.
    // why: pleading ← the hurt is real, so "I guess you think…" seems to ask for fairness; making up ← "huh?" and a
    //   calmer start heard as a friendly joke
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'special', seg: [54.4, 60.9],
      stem: 'After his long pause, how does Joey sound when he speaks again?',
      choices: ['Mocking Terry, with his pride hurt', 'Hurt, and pleading with Terry to be fair', 'Teasing Terry warmly to make up'],
      a: 0,
      cue: '「I guess you think」で始まる一文。',
      line: 'I guess *you think you’re pretty special*, huh? Sitting up here in your fancy small hall building.',
      said: '「自分は偉いと思ってるんだろ？立派な狭い建物に座って」と言う。',
      mean: 'you think you’re ～ は相手をとがめる決まり文句。傷ついたプライドの反撃。',
      trap: '頼んでいるようにも聞こえるが、you think you’re ～ はたいてい皮肉。',
      use: 'You think you’re so smart, huh?（自分は頭いいと思ってるんでしょ）' },

    // anchor: 57.7–60.1 s "your fancy small hall building" (his own "smaller" from 3.3–5.7 s turned into a weak insult);
    //   68.7–75.4 s "This is one star whose hoop… This is a star that the hoop… This hoop… I WAS DR. DRAKE RAMORAY":
    //   the line never ends, and he falls back on shouting his old role
    // R fix: V2, blind 60 %. "The put-downs sting him" was weak. The new near miss is the "small hall" jab, which does
    //   aim at Terry.
    // why: Terry ← "small hall building" heard as a real jab at his building; other stars ← "Making stars jump through
    //   hoops" heard as a jab at actors who go along
    { id: 'c2', skill: 'humor', level: 'C2', point: 'muddle', reveals: ['hoop'], seg: [57.2, 76.3],
      stem: 'In Joey’s comeback, who is the joke on?',
      choices: ['Joey himself: his put-downs keep falling apart', 'Terry: his small new building gets mocked',
                'Other stars: they let themselves be pushed around'], a: 0,
      cue: '悪口の中身と、最後の文がどこで止まるか。',
      line: '…your fancy *small hall building*… This is one star *whose hoop*… This is a star that *the hoop*…',
      said: '「立派な狭い建物」と言い、「このスターは輪っかを…」と何度も言いなおし、最後は昔の役名を叫ぶ。',
      mean: '言い返すつもりが、悪口は弱く、決めぜりふは最後まで出てこない。笑われているのは言っている本人。',
      trap: '狙っている相手が笑いの的とは限らない。言いかけで止まる文は、話し手が崩れている合図。',
      use: 'Let me start over. What I mean is…（言いなおすね。つまり…）' },

    // R fix: V2, blind 70 %. "Wait for hours" was weak. The new distractor is about auditions too: competing for
    //   parts. Also a broken character (U+FFFD) in mean is fixed.
    // why: show off ← the circus picture (hoops = 輪くぐりの芸) taken literally; compete ← auditions are contests, so
    //   the hoops seem to be rivals
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'hoops', seg: [62.1, 65.3],
      stem: 'What does Joey accuse Terry of making stars do?',
      choices: ['Go through pointless tests just for him', 'Compete with each other for his parts',
                'Perform tricks to entertain an audience'], a: 0,
      cue: '「Making stars」のあとの動詞と、その先。',
      line: 'Making stars *jump through hoops* for you, huh?',
      said: '「スターたちに輪くぐりをさせてるんだろ？」と責める。',
      mean: 'jump through hoops ＝ 相手の面倒な条件を次々こなす。ここではオーディション。',
      trap: 'サーカスの芸を思い浮かべて「見せ物」と取りやすい。比喩で、言いなりになって試されること。',
      use: 'I had to jump through hoops for this visa.（このビザを取るのに散々苦労した）' },

    // R fix: V2, blind 50 %. Both distractors were easy to rule out. The new ones give in on his own terms, or look
    //   back to the hoops he jumped through as Dr. Drake.
    // why: on his terms ← "This is one star whose hoop…" heard as a condition; back then ← "I WAS DR. DRAKE RAMORAY"
    //   heard as "I already paid my dues"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'hoop', reveals: ['hoops'], seg: [65.0, 76.3],
      stem: 'What is Joey trying to say in his last, broken lines?',
      choices: ['That he won’t jump through Terry’s hoops', 'That he’ll jump through them, but on his terms',
                'That he already jumped through hoops back then'], a: 0,
      cue: '「you know what?」のあと、言いかけてやめる文。',
      line: 'This is one star *whose hoop*… This is a star that *the hoop*…',
      said: '「このスターは輪っかを…」と言いかけ、結局「ドレイク役だったんだぞ」と叫ぶ。',
      mean: '言いたいのは「俺は言いなりにならない」。決めぜりふの言葉が出てこない。',
      trap: '昔の役名を叫ぶので過去の話にも聞こえる。言いかけの文は、直前の hoops からつなぐ。',
      use: 'I’m not doing it. End of story.（やらないよ。以上）' },
  ]
};
