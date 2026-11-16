// “Oh, the Wall - The Office US” (the official The Office channel, BEST OF SEASON 6): a company email and a news item
// that cuts off before its last word leave the office fearing bankruptcy; people panic, Michael can't reach his boss,
// and in the end they try to calm everyone by just getting on with work.
// Segments from the captions, words from whisper (2026-11-16). The sources differ at 10.5 s ("What's" / "here's the
// meaning"), 14.4 s ("get" / "got like eight"), 28.4 s ("Aaron" / "Erin"), 82.4 s ("shrewd" / "schrute farms"), 117 s,
// 182 s and 193.8 s ("Monkey see" / "lucky sea"); no key rests on those words. Whisper is garbled over the music at
// 148–168 s and loops one line from 226 s; no item uses those stretches, the bathroom bit (113–122 s) or the "Tuna"
// nickname. Speakers are named only where the audio names them ("Dwight", "Michael", "Erin", "the Nard Dog").
// REVIEW 2026-11-16: pass 9, fix 15, drop 0, new 0; ear checks 0
import type { Clip } from '../types.ts';

export const ohTheWall: Clip = {
  id: 'ohthewall', video: 'cC4MnBdFHRk', title: 'Oh, the Wall', dur: 239, wpm: 194, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: badly ← "killed" read as a disaster (殺した, the stage "died"); quit ← "once" heard as he never finished
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'killed', seg: [4.3, 9.2],
      stem: 'How did his one stand-up comedy show go, by his own account?',
      choices: ['Really well; the crowd loved it', 'Badly; the crowd didn’t laugh', 'He quit partway through the show'],
      a: 0,
      cue: '「Yeah」のあとの短い動詞。',
      line: 'I did stand-up comedy once. — You did? — Yeah, *I killed*.',
      said: '「一度スタンダップをやった」「ほんと？」「うん、大うけだった」と話す。',
      mean: 'I killed ＝ 大成功だった。舞台やプレゼンで「ばっちりうけた」の意味。',
      trap: 'kill を文字どおり「殺す」と取ると失敗に聞こえる。舞台の話なら大成功の意味。',
      use: 'Your speech? You totally killed it.（スピーチ？最高だったよ）' },

    // why: Erin ← her name comes up a few lines later; David Wallace ← the email's sender, heard as the one asking
    { id: 'w1', skill: 'who', level: 'B2', point: 'dwight', reveals: ['haveto'], seg: [9.1, 16.2],
      stem: 'Who asks Michael about the email everyone got?',
      choices: ['Dwight', 'Erin', 'David Wallace'], a: 0,
      cue: 'Michael の返事の最後に付く名前。',
      line: 'Hey, Michael? … — You’ll have to be more specific, *Dwight*.',
      said: '「マイケル、みんなに来たメールって何？」と聞かれ、「もっと具体的に頼むよ、ドワイト」と返す。',
      mean: '返事の最後の名前は呼びかけ。聞いたのはドワイトだと分かる。',
      trap: 'メールの送り主の名前も出てくるので、取り違えやすい。返事の呼びかけで決める。',
      use: 'You’ll have to be more specific.（もう少し具体的にお願い）' },

    // R fix: V2 (blind 70 %): "blame Michael" was a filler; both distractors now come from what's said (the email's
    //   "conjecture", Dwight's joke offer)
    // why: doubt it ← the email's "it's all conjecture" heard as everyone's view; joke ← the scarecrow offer and
    //   "Woo-hoo! Shout out!" heard as the mood
    { id: 'g1', skill: 'gist', level: 'B2', point: 'reaction', seg: [9.1, 87.3],
      stem: 'Once the article is read, how do most people in the office react?',
      choices: ['They panic about what will happen to them', 'They doubt it because of the boss’s email',
                'They joke about it and act unbothered'], a: 0,
      cue: '記事を読んだ直後の短い反応の連続。',
      said: 'メールと記事の続きを読んだあと、「仕事を失う」「会社が終わる」と次々に不安を口にする。',
      mean: 'うわさの段階でも、オフィス全体が将来を心配して動揺している。',
      trap: 'メールの「ただの推測」に引っぱられやすい。記事のあとの反応を聞く。',
      use: 'Everyone’s freaking out about the news.（みんなそのニュースで大騒ぎ）' },

    // why: eighteen / eighty ← -teen/-ty and the weak "like" before the number
    { id: 'n1', skill: 'number', level: 'B1', point: 'eight', seg: [12.3, 16.2],
      stem: 'How many emails a day does Michael say he gets?',
      choices: ['Eight', 'Eighteen', 'Eighty'], a: 0, keep: true,
      cue: '「like」のあと、emails の前の数。',
      line: 'I get like *eight emails a day*.',
      said: '「一日に8通くらいメールが来るんだ」と言う。',
      mean: 'like は「〜くらい」。8通は少ないので、「どのメール？」と聞き返すのはおかしい、という笑い。',
      trap: 'eighteen は後ろの teen が強く長い。eight は短く t で止まる。',
      use: 'I get like ten calls a day.（一日に10件くらい電話が来る）' },

    // R fix: V2 (blind 50 %): "a mistake by the paper" was the odd one out; "partly right, but overblown" is the
    //   nearer miss
    // why: true but not final ← "concrete news" heard as the news being real; overblown ← "stress" + "conjecture"
    //   unknown, heard as playing it down
    { id: 'd1', skill: 'detail', level: 'B2', point: 'conjecture', seg: [20.6, 28.1],
      stem: 'What does the boss’s email say about the item in the journal?',
      choices: ['It’s only guesswork for now', 'It’s true, but not final yet', 'It’s partly right, but overblown'], a: 0,
      cue: '「stress」のあとの一語と、次の「if」の文。',
      line: 'Just want to stress *it’s all conjecture*. If there’s any concrete news…',
      said: '「すべて推測だと強調したい。確かなことはすぐ知らせる」とある。',
      mean: 'conjecture ＝ 推測。記事を否定せず、まだ決まった話ではないと伝える。',
      trap: 'concrete news を「本当の話」と取りやすい。if があるので、まだ無い。',
      use: 'It’s just a guess at this point.（今の時点では推測にすぎない）' },

    // R fix: V2 (blind 50 %): the time-capsule filler is now the print paper, so "online" decides it
    // why: diary ← "Your Feelings Journal?" is the first answer heard; print edition ← "the Wall Street Journal"
    //   heard, the last word "online" lost
    { id: 'i1', skill: 'infer', level: 'B2', point: 'journal', seg: [28.1, 36.5],
      stem: 'Which “journal” did the boss’s email really mean?',
      choices: ['A newspaper’s website', 'A newspaper’s print edition', 'Michael’s feelings diary'], a: 0,
      cue: '「he means」のあとの名前。',
      line: 'Your *Feelings Journal*? … — Michael, he means *the Wall Street Journal online*.',
      said: 'Erin は「気持ち日記？」と聞き返し、別の人が新聞のサイトのことだと言う。',
      mean: 'journal は日記にも新聞にも使う。メールが指すのは新聞のサイト。',
      trap: 'Feelings Journal に引っぱられやすい。最後の online まで聞く。',
      use: 'I read it in the paper this morning.（今朝の新聞で読んだ）' },

    // why: $1.09 ← "dollar ninety-nine" with "ninety" shrunk; $1.90 ← the last "-nine" lost
    { id: 'n2', skill: 'number', level: 'B1', point: 'price', seg: [49, 52.4],
      stem: 'How much does it cost to finish the article?',
      choices: ['$1.09', '$1.90', '$1.99'], a: 2, keep: true,
      cue: '「It’s a dollar」のあとの数。',
      line: 'It’s *a dollar ninety-nine* to finish the article.',
      said: '「続きを読むのに1ドル99セントかかる」と言う。',
      mean: '値段は dollar のあとにセントを続けて言う。1.99 は「ワンダラー・ナインティナイン」。',
      trap: 'ninety の t が弾んで「ナイニー」に近い。最後の nine まで聞く。',
      use: 'It’s three ninety-nine for the large.（Lサイズは3ドル99です）' },

    // R fix: V2 (blind 70 %): "made the whole story up" was weak; the new miss takes the cut-off as the story's end
    // why: knows the end ← "I wonder" heard as a teasing hint; cut-off is the end ← "the article cuts off" heard as
    //   how it really ends
    { id: 'h3', skill: 'humor', level: 'C1', point: 'wonder', reveals: ['price'], seg: [49, 56.5],
      stem: 'Why does “I wonder what it was going to say” get a laugh?',
      choices: ['He would rather wonder than pay to read it', 'He already knows how the article will end',
                'He thinks the cut-off is how the story ends'], a: 0,
      cue: '直前の値段の話と、「Are you serious?」の反応。',
      line: 'It’s a dollar ninety-nine to finish the article. — I wonder… — *Are you serious?*',
      said: '続きは1.99ドルと聞き「何て書いてあったんだろう」と言い、「本気？」と返される。',
      mean: '会社の運命より小銭を惜しむ。大事なことを小さな理由で放り出すずれが笑い。',
      trap: 'I wonder を「知っている」ほのめかしと取りやすい。直後の反応が答え。',
      use: 'Are you serious? Just pay for it.（本気？払えばいいでしょ）' },

    // R fix: V2 (blind 60 %) + K1: "read it before he did" was defensible (whoever paid reads first); now "got the
    //   joke" and "hit him" carry the two literal readings
    // why: got the joke ← "I got it" heard as "I understand"; hit ← beat read literally as 叩く, after "Oh!"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'beat', seg: [56.6, 61.3],
      stem: 'After someone says “I got it”, what does the next speaker mean?',
      choices: ['Someone paid before he could', 'Someone got the joke before he did', 'Someone hit him by accident'],
      a: 0,
      cue: '「Oh!」のあと、me to it で終わる言い方。',
      line: 'I got it. I got it. — Oh! Tuna *beat me to it*.',
      said: '「払った」の声に、別の人が「先を越された」と言う。',
      mean: 'beat someone to it ＝ 先にやられる。自分が払うつもりだったのに、先に払われた。',
      trap: 'beat を「叩く」、got it を「分かった」と取りやすい。値段の直後なら「払う」。',
      use: 'He beat me to the last seat.（最後の席、先に取られた）' },

    // R fix: V2 (blind 55 %): "Selling the company" is now "Restructuring", a word said a few seconds later
    // why: closing branches ← the board-meeting topic heard as cuts; restructuring ← said at 72 s as one thing
    //   bankruptcy can mean
    { id: 'd4', skill: 'detail', level: 'B1', point: 'bankrupt', seg: [61.2, 65.3],
      stem: 'What is the board rumored to recommend?',
      choices: ['Declaring bankruptcy', 'Closing some branches', 'Restructuring the company'], a: 0,
      cue: '「recommend」のすぐあとの二語。',
      line: 'It is rumored that they will recommend *declaring bankruptcy*.',
      said: '「破産申請を勧めるとうわさされている」と記事の続きを読む。',
      mean: 'declare bankruptcy ＝ 破産を申し立てる。全員の不安が一気に高まる。',
      trap: 'board や rumored から別の話を想像しやすい。recommend のあとを最後まで。',
      use: 'The airline declared bankruptcy last year.（その航空会社は去年破産した）' },

    // R fix: V2 (blind 55 %): reworded so the key isn't the only nuanced choice
    // why: not right away ← "Not necessarily" heard as "not yet"; can't be trusted ← the email's "conjecture"
    //   carried over
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'notnec', reveals: ['bankrupt'], seg: [67.3, 73.75],
      stem: 'When someone says they will all lose their jobs, what does the reply do?',
      choices: ['Offers a less frightening reading', 'Admits it, but says not right away',
                'Says the article can’t be trusted'], a: 0,
      cue: '「Not necessarily」のあとの「Maybe」。',
      line: '*Not necessarily*. Bankruptcy could mean a lot of things. *Maybe* they’re just restructuring…',
      said: '「必ずしもそうじゃない。立て直しのためかも」と別の可能性を出す。',
      mean: 'Not necessarily で決めつけをゆるめ、Maybe でましな見方を示している。',
      trap: '記事の否定ではない。Not necessarily は「そうとは限らない」。',
      use: 'Not necessarily. It could be good news.（そうとは限らないよ。いい話かも）' },

    // R fix: V2 (blind 75 %): the key was the only twist and the longest; shortened and rebalanced
    // why: mocking ← "sounds awful" heard as sarcasm; never out of debt ← "get out of debt" heard as hopeless
    { id: 'h4', skill: 'humor', level: 'C1', point: 'awful', seg: [71.6, 78],
      stem: 'Why does “Oh, that sounds awful” get a laugh?',
      choices: ['Even the hopeful option frightens him', 'He’s making fun of the bad news',
                'He thinks they’ll never get out of debt'], a: 0,
      cue: '「just restructuring」の「just」と、次の反応。',
      line: 'Maybe they’re *just restructuring*… — Oh, *that sounds awful*. — *Or* it could mean the end…',
      said: '「立て直しかも」に「ひどい話だ」と返り、「または会社の終わりかも」と続く。',
      mean: 'just が付くましな話にもおびえるので、なぐさめが効かない。',
      trap: 'awful を皮肉と取りやすい。just restructuring は「ましな方」として出ている。',
      use: 'Relax, it’s just a small change.（落ち着いて、ちょっとした変更だよ）' },

    // R fix: V2 (blind 50 %): "good pay" contradicted a line everyone hears; "low pay" now borrows it
    // why: farm stand ← "jobs at Schrute Farms" heard as ordinary farm work; low pay ← "doesn't pay much" heard,
    //   "as human scarecrows" lost
    { id: 'd5', skill: 'detail', level: 'B1', point: 'scarecrow', seg: [80.2, 87.3],
      stem: 'What jobs does someone offer everyone at his farm?',
      choices: ['Standing in the fields as scarecrows', 'Picking crops in the fields for low pay',
                'Selling produce at the farm stand'], a: 0,
      cue: '「as」のあとの二語と、そのあとの条件。',
      line: 'You can all have jobs at Schrute Farms, *as human scarecrows*. It *doesn’t pay much*…',
      said: '「みんなうちの農場で雇ってやる。人間かかしとして。給料は安いし、組合も作れない」と言う。',
      mean: '親切な申し出の形で、実はひどい条件を並べている。',
      trap: 'farms から普通の農作業を想像しやすい。as のあとに仕事の中身が来る。',
      use: 'You can stay with us, but it’s tiny.（うちに泊まっていいけど、狭いよ）' },

    // R fix: V2 (blind 55 %): "agrees to check on David" was a filler; "tells him off" is the other way to react
    // why: plays along ← Michael's own "wouldn't that be hilarious" heard as shared fun; tells him off ← the pause
    //   heard as disapproval (the Japanese frame: 沈黙は不快のしるし)
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'spy', seg: [87.3, 100],
      stem: 'How does David’s assistant react to Michael’s idea about her boss?',
      choices: ['She lets it pass and wraps up the call', 'She tells him off for the idea',
                'She laughs and plays along with it'], a: 0,
      cue: '間のあと、彼女が最初に言う一文。',
      line: 'maybe you should *spy on him*. … wouldn’t that be hilarious? … *I’ll just have him call you back*',
      said: '「スパイしてみたら？面白くない？」に少し間があき、「折り返させます」とだけ返す。',
      mean: '冗談には触れず、決まり文句で電話を終わらせようとしている。相手にしていない。',
      trap: '本人が「面白い」と言うので、うけたと取りやすい。返事が冗談に触れているかを聞く。',
      use: 'I’ll have her call you back.（彼女から折り返させます）' },

    // why: happy ← "last day at work" heard as a holiday; annoyed ← "what if" heard as a complaint
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'lastday', seg: [122.6, 128],
      stem: 'How does the speaker feel at “what if this is our last day”?',
      choices: ['Scared of losing the people at work', 'Happy at the thought of a long break',
                'Annoyed that the work might go on'], a: 0,
      cue: '二つ目の「What if」の中身。',
      line: 'What if *we never see each other ever again*?',
      said: '「今日が最後の出社だったら？もう二度と会えなかったら？」と言う。',
      mean: '仕事より、仲間と会えなくなることを心配している。',
      trap: 'last day を休みと取ると明るく聞こえる。never … ever again が気持ちを決める。',
      use: 'What if we never come back here?（もうここに来られなかったら？）' },

    // R fix: V2 (blind 65 %): both distractors were negative fillers; now a take-back (「なんてね」) and "already told
    //   her", which the next line refutes
    // why: half joking ← the Japanese frame 「…なんてね」 after a confession; told her ← "I said it" heard as said to
    //   Erin
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'saidit', seg: [133.9, 137.5],
      stem: 'Right after “I like Erin”, what do his next words show?',
      choices: ['Saying it out loud took some nerve', 'He is half joking and takes it back',
                'He has already told Erin to her face'], a: 0,
      cue: '名前のあとの、短い三語。',
      line: 'I like Erin. *There, I said it.*',
      said: '「エリンが好きだ。よし、言ったぞ」とカメラに話す。',
      mean: 'There, I said it ＝ 言いにくいことを思い切って口にしたときの決まり文句。',
      trap: '照れ隠しの「なんてね」と取りやすいが、取り消してはいない。言い切ったあとの「よし」に近い。',
      use: 'I hate that song. There, I said it.（あの歌、嫌い。言っちゃった）' },

    // R fix: V2 (blind 55 %): "come up at work" was weak; "his main focus" reads "front" as a front line
    // why: hard to admit ← the "There, I said it" just before carries over; main focus ← "on that front" read as
    //   his top priority
    { id: 'f5', skill: 'phrase', level: 'C1', point: 'panned', seg: [137.5, 142.6],
      stem: 'What does he say about his hope that Erin would make the first move?',
      choices: ['It hasn’t worked out so far', 'It hasn’t been easy to admit', 'It hasn’t been his main focus'],
      a: 0,
      cue: '「but things have not」のあとの動詞。',
      line: 'I was kind of hoping she would ask me out, but things have not *panned out* on that front.',
      said: '「誘ってほしかったけど、そっちはうまくいってない」と言う。',
      mean: 'pan out ＝ 思いどおりになる。on that front ＝ その方面では。',
      trap: 'front を「最前線」と取ると力の入れ方の話になる。on that front は話題を指す。',
      use: 'The plan didn’t pan out.（その計画はうまくいかなかった）' },

    // R fix: V2 (blind 80 %): "give up" and "wait" were refuted by the stem's "decided to do"; both misses are now
    //   indirect ways to act
    // why: friend asks ← the Japanese frame of going through a friend; hints ← "hoping she would ask me out" heard as
    //   still the plan, helped along
    { id: 'i4', skill: 'infer', level: 'B2', point: 'paws', seg: [137.5, 148.6],
      stem: 'What has he decided to do about Erin?',
      choices: ['Ask her out himself', 'Have a friend ask her for him', 'Hint until she asks him'], a: 0,
      cue: '最後の「So」のあと、take matters で始まる言い方。',
      line: 'So, it’s time for the Nard Dog to *take matters into his own paws*.',
      said: '「ナード・ドッグが自ら動くときだ」と言う。',
      mean: 'take matters into one’s own hands ＝ 自分で動く。待つのをやめる。',
      trap: '前の hoping she would ask me out が残りやすい。So のあとが結論。',
      use: 'Time to take matters into my own hands.（自分でどうにかするときだ）' },

    // why: gently ← paws heard as soft, careful hands; a slip ← the changed idiom heard as a mistake
    { id: 'h5', skill: 'humor', level: 'C1', point: 'paws', seg: [141.9, 148.6],
      stem: 'Why does he end the saying with “paws”?',
      choices: ['He calls himself a dog, so hands become paws', 'He means he’ll go about it gently, like a pet',
                'He mixes up the usual saying by mistake'], a: 0,
      cue: '自分を何と呼んでいるか。',
      line: 'it’s time for *the Nard Dog* to take matters into his own *paws*.',
      said: '自分を「ナード・ドッグ」と呼び、「自分の足で」と決め台詞を言う。',
      mean: '本来は own hands。自分を犬と呼んだので、手を「肉球のある足」に替えた言葉遊び。',
      trap: '決まり文句が変わると、うっかりと思いやすい。直前の自分の呼び名とつながっている。',
      use: 'The chef took matters into his own hands.（シェフが自ら動いた）' },

    // why: had to ← "have to" ≈ ハフタ heard as past; got to ← gotta, same meaning, different sound; need to ← meaning
    //   fits, the sound doesn't
    { id: 's1', skill: 'sound', level: 'B2', point: 'haveto', seg: [167.9, 172.1],
      stem: 'Fill the gap: “We ___ do something.”',
      choices: ['have to', 'had to', 'got to', 'need to'], a: 0,
      cue: '文の最初、We のあとの二語の音。',
      line: 'We *have to* do something because people are losing it out there',
      said: '「何かしないと。みんな不安でどうにかなりそう」と言う。',
      mean: 'have to は「ハフタ」と、v が f に変わって短くなる。今これからの話。',
      trap: 'had to なら過去で、d の音が残る。後ろの are losing が今の話だと示す。',
      use: 'We have to leave by six.（6時までに出なきゃ）' },

    // R fix: V2 (blind 50 %) + K1: "promising the company is safe" was close to "no reason to think the company is
    //   anything but fine"; replaced by going home early
    // why: funny video ← "Anything new on YouTube?" is the first idea heard; go home ← "what if this is our last
    //   day" heard as the plan
    { id: 'g2', skill: 'gist', level: 'B1', point: 'calm', seg: [167.9, 218.3],
      stem: 'How do they finally try to calm the office down?',
      choices: ['By acting normal and getting on with work', 'By finding a funny video for everyone',
                'By letting everyone go home early'], a: 0,
      cue: '会議室で最後に提案すること。',
      said: '気をそらす方法を探したあと、自分たちが普段どおり働けばみんなも続く、と決めて会議で伝える。',
      mean: '新しい情報はないので、手本を見せて落ち着かせる作戦。',
      trap: 'YouTube の話が先に出るので、それが作戦に聞こえやすい。最後の会議の言葉で決める。',
      use: 'Let’s just carry on as usual.（いつもどおりやろう）' },

    // why: what do we have ← grammar "fixes" it to the usual question form; what have you ← "we" heard as "you" in fast
    //   speech
    // anchor: 198.9–200.3 s both sources: "So, what have we on the docket today?" (no "do"), slow enough to hear
    //   each word
    // retired: one C2 alone is under 2 (c2 retired)
    { id: 'c1', skill: 'dict', level: 'C2', point: 'docket', seg: [198.3, 201.2], retired: true,
      stem: 'Type the start: “So, ___ on the docket today?” (3 words)', answer: 'what have we',
      cue: '「So」のあと。文法より、聞こえた語を。',
      line: 'So, *what have we* on the docket today?',
      said: '「さて、今日の予定は何かね」と聞く。do を使わない、古風で気取った聞き方。',
      mean: 'What have we …? は what do we have の古い形。わざと重々しく言って、上司らしさを演じている。',
      trap: '習った疑問文に合わせて do を足したくなる。言われた語をそのまま書く。',
      use: 'What have we here?（さて、これは何かな）' },

    // R fix: V2 (blind 70 %): "everyone is relieved" was a filler; the new miss reads "when things are good" as now
    // why: things are good ← "when things are good" heard as the present; slack till news ← "slack off" heard without
    //   "only… when things are good"
    // anchor: 212.3–215 s "doing our work will make us feel better", then 215.8–217.4 s "I only slack off when things
    //   are good": things aren't good now, so the work everyone is doing is the sign of fear
    // retired: for the draws (play 3+ under g2 drew no C2: it reveals g2's point)
    { id: 'c2', skill: 'infer', level: 'C2', point: 'slack', reveals: ['calm'], seg: [207.7, 218.3], retired: true,
      stem: 'After the call to keep working, what does the last line reveal?',
      choices: ['Hard work here is a sign things are bad', 'Things are good, so he can take it easy',
                'He plans to slack off until news comes'], a: 0,
      cue: '「only」と、そのあとの条件。',
      line: 'doing our work will make us feel better. — I *only slack off when things are good*.',
      said: '「仕事をすれば気分が良くなる」のあと、別の人が「なまけるのは調子がいいときだけ」と言う。',
      mean: '裏返せば普段はなまけていて、今働くのは不安だから。前向きな提案の裏を明かす一言。',
      trap: 'slack off だけ聞くと「これからさぼる」と取りやすい。only … when の条件を裏返して考える。',
      use: 'I only cook when I’m stressed.（料理するのはストレスがあるときだけ）' },

    // dict: "as of yet" runs together, "of" ≈ ə
    { id: 'x1', skill: 'dict', level: 'B2', point: 'yet', reveals: ['calm'], seg: [208.3, 212.25],
      stem: 'Type it: “There is no new information ___.” (3 words)', answer: 'as of yet',
      cue: '「information」のすぐあと、so の前。',
      line: 'There is no new information *as of yet*, so I suggest we all just keep working.',
      said: '「今のところ新しい情報はない。みんな仕事を続けよう」と言う。',
      mean: 'as of yet ＝ 今のところ（まだ）。as of が「アザヴ」とつながり、of はほぼ消える。',
      trap: 'of が弱く、as yet に聞こえやすい。3語なので間の of を探す。',
      use: 'No word from them as of yet.（今のところ先方から連絡なし）' },
  ]
};
