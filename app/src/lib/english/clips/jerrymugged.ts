// “Jerry Gets Mugged | Parks and Recreation” (the official Parks and Recreation channel, Season 2): Leslie uses Jerry's
// mugging on the local news to shame City Hall, her boss scolds her but the parks get money, and at the press event it
// comes out that Jerry was never mugged at all.
// Segments from the captions, words from whisper (2026-11-16). The captions garble 109–116 s (“i wasn't much the safety
// of our citizens”) and names (“sherry” for Jerry); no key rests on that stretch. Left out on purpose: “the farting”
// (147 s), the Klondike-bar line (167–169 s, a “kill your wife” joke on world knowledge) and who says which backstage
// line (stems leave the speakers out).
// REVIEW 2026-11-16: pass 8, fix 14, drop 0, new 0; ear checks 0 (the two on s1/x1 and nt2 are gone: both sources
//   agree word for word on “so I go to reach for it” and “it lands on a log”, rubric addendum)
// Open: blind reads lean on knowing the show (Jerry as the butt of jokes, Leslie's earnestness); after the fixes my
//   own re-read still finds g2 and h3 the likeliest picks.
import type { Clip } from '../types.ts';

export const jerryMugged: Clip = {
  id: 'jerrymugged', video: '8nFrX9ZidDA', title: 'Jerry Gets Mugged', dur: 190, wpm: 141, band: 'slow',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 60 %: the key was the overlap of the other two choices (money ×2, thanks ×2); now three
    //   choices that share no half
    // why: praise, no money yet ← "you'll be happy to know your little stunt worked" taken at face value, and the
    //   announcement is "tomorrow"; Carl fired ← "head of security… he's failing" + "security upgrades"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['stunt'], seg: [0, 91.2],
      stem: 'What does Leslie’s TV appearance end up getting her?',
      choices: ['Money for the parks, though her boss is angry', 'Her boss’s praise, but no money until next year',
                'A new head of security, and more guards'], a: 0,
      cue: 'テレビのあと、上司が最初に言う一言と、そのあとの知らせ。',
      said: 'テレビで市の対応を批判し、上司に叱られる。けれど結果、公園に予算が回る。',
      mean: '叱られたのに目的は果たした、というねじれた結末。',
      trap: 'worked や happy から褒められたと取りやすいが、その前に叱る言葉が続いている。',
      use: 'It worked, but I got in trouble.（うまくいったけど、怒られた）' },

    // R fix: V2, blind 70 %: the key was the only "means to… but" choice; the friend/coworker distractor was half
    //   true (both words are said). Now all three are intent-vs-result
    // why: tease ← the flaws sound like insults, so it reads as a jab that went too far; nervous ← the odd list heard
    //   as live-TV slips, the usual sitcom script
    { id: 'h1', skill: 'humor', level: 'C1', point: 'intro', seg: [11.5, 23.15],
      stem: 'Why is Leslie’s description of Jerry on TV funny?',
      choices: ['She means to support him but lists his flaws', 'She means to tease him, but it comes out cruel',
                'She’s nervous on live TV and the words come out wrong'], a: 0,
      cue: '名前のあとに並ぶ言葉の中身と、最後の一語。',
      line: 'This is my co-worker, Jerry Gergich. Diabetic, *sloppily out of shape*, *friend*.',
      said: '同僚の Jerry を「糖尿病で、だらしなく太った、友人」と紹介する。',
      mean: '味方として紹介しているのに、欠点ばかり並べてしまう。悪気がないのが笑い。',
      trap: '悪口に聞こえるのでわざとからかったと取りやすいが、最後を friend で締めている。',
      use: 'Let me introduce my coworker, Ken.（同僚の Ken を紹介します）' },

    // R fix: S4, the segment was 19.6 s (cap 15); now 21.6–33.2 s from “He was mugged”, so "he" (Jerry) is the
    //   anchor. V2, blind 65 %: the muggers filler became Carl, named right after the list (last-heard name)
    // why: viewers ← every item starts with "your", so it sounds aimed at the audience's families; Carl ← she
    //   blames him by name straight after, so the list seems to lead up to him
    // anchor: 22.1 s "He was mugged this morning", then 31.2–31.9 s the list ends on "your unpopular co-worker": the
    //   last "victim" is what the victim just was, a co-worker
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'intro', seg: [21.6, 33.2],
      stem: 'In Leslie’s list of who could be next, who is the joke on?',
      choices: ['Jerry: the last one sounds just like him', 'The viewers, whose families she makes fun of',
                'Carl: she is leading up to blaming him'], a: 0,
      cue: 'リストの最後の語と、その前の he が誰か。',
      line: 'He was mugged this morning… Who’s next? Your frumpy uncle, your simple neighbor, your *unpopular co-worker*.',
      said: '「今朝襲われた。次は誰？さえないおじさん、単純なお隣さん、人気のない同僚」と問いかける。',
      mean: '一般論の形で、紹介したばかりの同僚 Jerry と同じ co-worker で終わる。最後の語で誰か分かる。',
      trap: 'your が続くので視聴者への悪口に聞こえる。リストの最後は、前に出た語と比べる。',
      use: 'Present company excluded, of course.（ここにいる人は別だけどね）' },

    // R fix: V2, blind 60 %: "police" was the only choice without money, so the key was one of two; now all three
    //   are about the money
    // why: on its way ← "coming" read as in progress; cut ← "your government is failing you" heard as a budget cut
    { id: 'd1', skill: 'detail', level: 'B2', point: 'cityhall', seg: [40.9, 49.25],
      stem: 'What does Leslie say is stopping the parks from being made safe?',
      choices: ['City Hall hasn’t given them the money', 'City Hall’s money is still on its way',
                'City Hall cut the money they already had'], a: 0,
      cue: 'need のあと、何が必要で、それがどうなっているか。',
      line: 'We need *money* from City Hall, and it’s *not coming through*.',
      said: '「市役所からのお金が必要なのに、出てこない」と言う。',
      mean: 'come through ＝（お金や助けが）実際に届く。否定なので「出ない」。',
      trap: 'coming を「届く途中」と取ると「まだ来ないだけ」に引かれる。',
      use: 'My refund finally came through.（やっと返金が届いた）' },

    // R fix: V2, blind 50 %: the key was the only rebuke; now all three are rebukes, and "how" became a permission
    //   rebuke
    // why: put you up to ← possess = 取りつく, so "what controlled you" becomes "who made you"; without me ← the usual
    //   boss script (clear it with me first)
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'possessed', seg: [59.1, 70.8],
      stem: 'When Paul first speaks to Leslie after the broadcast, what is he really asking?',
      choices: ['Why on earth would you do that?', 'Who put you up to doing that?', 'How could you go on TV without me?'], a: 0,
      cue: '最初の質問と、そのあと続く叱る言葉。',
      line: '*What possessed you* to do that?',
      said: '放送のあと、上司が「何を考えてあんなことを」と問い詰める。',
      mean: 'What possessed you…? は理由を聞く形の非難。「あきれた」を伝える。',
      trap: 'possess を「取りつく」と取ると「誰にやらされた」に引かれる。叱るときの決まった形。',
      use: 'What possessed you to buy that?（なんでそんなの買ったの）' },

    // R fix: V2, blind 50 %: two "Apologizing…" choices made the key the odd one out; the staff-mistake one became a
    //   blame reading
    // why: promise ← the Japanese すみません frame: an apology ends with reflection; blaming security ← she blamed
    //   Carl on air, and "got mugged in the park" sounds like a security failure
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'sorrybut', seg: [61.2, 66.0],
      stem: 'When Leslie answers with “I’m sorry, Paul…”, what is she doing?',
      choices: ['Defending why she went on TV in the first place', 'Apologizing and promising not to do it again',
                'Blaming her head of security for the mugging'], a: 0,
      cue: 'sorry のすぐあとの短い一語と、そのあとの理由。',
      line: 'I’m sorry, Paul, *but* one of my guys *got mugged* in the park.',
      said: '「すみません、でも部下が公園で襲われたんです」と返す。',
      mean: 'I’m sorry, but… は謝罪より、言い分の前置き。本音は but のあと。',
      trap: '日本語の「すみません」は謝って終わるので反省に取りやすい。but のあとを聞けば、引いていない。',
      use: 'Sorry, but I have to say something.（悪いけど、言わせて）' },

    // why: upset ← "how upset you are" comes first, so the rule sounds like "don't show feelings"; asking first ← the
    //   usual workplace script (clear it with the boss)
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'badmouth', seg: [64.2, 70.8],
      stem: 'What does Paul tell Leslie she must never do?',
      choices: ['Speak badly of the city on TV', 'Show how upset she is on TV', 'Go on TV without asking him first'], a: 0,
      cue: 'do not のあとの動詞。',
      line: 'I don’t care how upset you are. You do not *badmouth your own government* on TV.',
      said: '「どれだけ腹が立っても、テレビで自分の役所を悪く言うな」と言う。',
      mean: 'badmouth ＝ 人や組織の悪口を言う。ここでは公の場で市を批判すること。',
      trap: 'upset が先に聞こえるので「感情を出すな」と取りやすい。禁止の中身は do not のあと。',
      use: 'Never badmouth your old boss.（前の上司の悪口は言わないこと）' },

    // R fix: V2, blind 60 %: "the stunt did nothing" contradicted "worked", and "glad, and proud" was a filler; now
    //   two sincere readings of the good news. K6: the key no longer quotes "little stunt" (a fresh read keyed on it)
    // why: relieved ← the money is real news, so he seems glad it's solved; pleased the mayor agreed ← "you'll be
    //   happy to know" taken sincerely
    { id: 't1', skill: 'attitude', level: 'C1', point: 'stunt', seg: [71.0, 80.5],
      stem: 'As Paul passes on the mayor’s decision, how does he feel about it?',
      choices: ['Annoyed that her TV trick got results', 'Relieved that the money finally came through',
                'Pleased that the mayor agreed with her'], a: 0,
      cue: 'worked の前、彼女の行動を呼ぶ言い方。',
      line: 'I’m sure you’ll be happy to know your *little stunt* worked.',
      said: '「喜ぶだろうね、君の小芝居はうまくいった」と言う。',
      mean: 'little stunt は「ちょっとした芝居」と見下す言い方。結果は事実だが、本人は面白くない。',
      trap: 'happy や worked を素直に取ると「安心」に聞こえる。見下す語が本音。',
      use: 'Happy now? You got your way.（満足？思い通りだね）' },

    // why: $250 ← the "thousand" in the middle is short and weak; $25,000 ← "two… five" plus a big-budget picture
    { id: 'n1', skill: 'number', level: 'B1', point: 'amount', seg: [74.4, 80.5], keep: true,
      stem: 'How much will the mayor move to the parks?',
      choices: ['$250', '$2,500', '$25,000'], a: 1,
      cue: 'divert のすぐあとの数。',
      line: 'The mayor is going to divert *$2,500* to the parks',
      said: '市長が2,500ドルを公園の警備強化に回す、と言う。',
      mean: 'divert ＝（予算を）別の所から回す。大金ではないが、狙いは通った。',
      trap: '桁の語は弱く速い。数は「最初の数字＋桁の語」をセットで聞く。',
      use: 'It’s twenty-five hundred dollars.（2,500ドルです）' },

    // R fix: V2, blind 50 %: "get out of bringing Jerry" was a filler; now a go-along reading
    // why: can't tell ← the words taken literally; plays along ← the Japanese frame of going along with the boss's
    //   joke, and "doofus" sounds like banter
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'respect', seg: [84.5, 91.2],
      stem: 'When Paul says to bring “the doofus…”, what does Leslie’s reply do?',
      choices: ['Pushes back on the way he talks about Jerry', 'Says honestly she can’t tell who he means',
                'Plays along with his joke about Jerry'], a: 0,
      cue: '「分からない」のあとに続く、もう一文。',
      line: 'I don’t know *who you’re referring to*. We treat everyone with *respect* around here.',
      said: '「誰のことか分かりません。ここでは全員に敬意を払っています」と返す。',
      mean: '分からないふりで、悪口の呼び方を受け入れないと示す遠回しな抗議。',
      trap: '文字通りなら「本当に分からない」。直後の respect の文が、何に反対しているかを示す。',
      use: 'Sorry, who are you referring to?（失礼、誰のことでしょう）' },

    // R fix: V2, blind 70 %: the stem's scare quotes on “mugging” gave the key away; the stem now names no event, and
    //   "another park" became "less badly than she said". Reveals `fall` too (the key rules out an attack)
    // why: too shaken ← Leslie's "hysterical muteness" taken at face value (and the title says "mugged"); less badly
    //   ← "This is real… I really dislocated my shoulder" heard as proof of an attack
    { id: 'g2', skill: 'gist', level: 'B2', point: 'notmugged', reveals: ['mute', 'doubt', 'fall'], seg: [92.4, 167.1],
      stem: 'By the end, what do we learn about what happened to Jerry?',
      choices: ['Nobody had attacked him in the first place', 'He was too shaken by the attack to speak',
                'He was attacked, but less badly than she said'], a: 0,
      cue: '会見のあと、裏での会話の内容。',
      said: '会見で Leslie は Jerry を被害者として紹介するが、裏では本人が転んだだけだと話す。',
      mean: '予算は取れたが、きっかけの事件はなかった、という皮肉な流れ。',
      trap: '「話せないほどのショック」をそのまま信じやすい。あとの舞台裏の会話が答え合わせ。',
      use: 'Wait, so it never happened?（待って、じゃあ実際はなかったの？）' },
    // why: hurrying ← short commands in a row heard as impatience; telling him what to say ← "Just talk about how
    //   hard it was" heard as a script
    { id: 't2', skill: 'attitude', level: 'B1', point: 'nervous', reveals: ['heart'], seg: [102.9, 110.0],
      stem: 'How does Leslie talk to Jerry just before the event?',
      choices: ['Gently, to settle his nerves', 'Gently, but hurrying him along', 'Firmly, telling him what to say'], a: 0,
      cue: '最初の質問と、最後の短い一文。',
      line: 'Jerry, are you *nervous*?… Speak from the heart. *You’ll be fine.*',
      said: '「緊張してる？大変だったことを話すだけ。心のままに。大丈夫」と声をかける。',
      mean: '短い質問と励ましを重ねて、落ち着かせようとしている。',
      trap: 'Just talk about… を指示と聞くと「台本の押しつけ」に見えるが、最後は安心させる言葉。',
      use: 'Take a breath. You’ll be fine.（深呼吸して。大丈夫）' },

    // R fix: V2, blind 55 %: the script distractor was the opposite of "speak from the heart" and easy to rule out;
    //   now "by heart", the idiom Japanese learners mix it up with
    // why: health ← heart = 心臓, and "diabetic" came earlier; by heart ← from/by the heart confused (暗記)
    { id: 'f4', skill: 'phrase', level: 'B1', point: 'heart', seg: [104.5, 109.6],
      stem: 'What does Leslie advise Jerry to do in his speech?',
      choices: ['Say honestly how he really feels', 'Learn what to say by heart', 'Talk about his health problems'], a: 0,
      cue: 'Speak のあとの3語。',
      line: 'Just talk about how hard it was for you. *Speak from the heart.*',
      said: '「大変だったことを、心から話せばいい」と助言する。',
      mean: 'speak from the heart ＝ 用意した言葉でなく、正直な気持ちで話す。',
      trap: 'heart を「心臓」と取ると健康、by heart（暗記）と混ぜると暗記に引かれる。',
      use: 'Write the card from the heart.（カードは心をこめて書いて）' },

    // R fix: V2, blind 50 %: "a medical term she can't explain" was a filler; now an exaggeration reading
    // why: doubts her story ← a tag question read as uncertainty (日本語の「〜かな？」); bigger ← "hysterical muteness
    //   from trauma" is the loudest odd phrase, so the overstatement seems to be the joke
    { id: 'h2', skill: 'humor', level: 'C1', point: 'mute', reveals: ['notmugged'], seg: [122.9, 134.4],
      stem: 'Why is Leslie’s “Correct, Jerry?” funny?',
      choices: ['He’d have to speak to say she’s right', 'Her question shows she doubts her own story',
                'She makes his trauma sound bigger than it is'], a: 0,
      cue: '話せない理由を言った直後に、本人へ向けた問い。',
      line: 'He *can’t talk* right now because he has hysterical muteness from trauma. Correct, Jerry?',
      said: '「Jerry はトラウマで話せないんです。ね、Jerry？」と本人に確かめる。',
      mean: '話せないと言った直後に返事を求める。答えれば嘘が崩れる矛盾が笑い。',
      trap: '付加疑問を「自信がない」と取りやすい。Correct? は同意を引き出す形。',
      use: 'Back me up here, right?（ほら、味方してよ）' },

    // why: somewhere else ← "in the park" taken literally, as a question of place; injury fake ← "Is this fake?" just
    //   before, but he has shown it's real and the question moves on
    { id: 'i2', skill: 'infer', level: 'B2', point: 'doubt', seg: [137.3, 146.7],
      stem: 'What does the question about being “in the park yesterday” suggest?',
      choices: ['The asker thinks the mugging was made up', 'The asker thinks it happened somewhere else',
                'The asker thinks Jerry’s injury is fake'], a: 0,
      cue: '質問の中の短い強めの語と、Jerry の言い訳の始まり。',
      line: 'This is real… Were you *even* in the park yesterday? — *Look*, I was on my way to…',
      said: '「昨日そもそも公園にいたの？」と聞かれ、事情を話し始める。',
      mean: 'even ＝「そもそも」。けがから、事件そのものを疑う質問に変わる。',
      trap: 'Is this fake? から「けがを疑う」と取りやすいが、けがは本物と認めた上で事件を疑っている。',
      use: 'Were you even listening?（そもそも聞いてた？）' },

    // why: burrito ← the clearest noun, heard as where he was going; dog ← a dog lunges at a bird a moment later
    { id: 'd3', skill: 'detail', level: 'B1', point: 'way', seg: [141.9, 146.7],
      stem: 'Where was Jerry going when it all started?',
      choices: ['To feed the hummingbirds', 'To buy a breakfast burrito', 'To walk his dog by the creek'], a: 0,
      cue: 'on my way to のすぐあと。',
      line: 'I was *on my way to feed the hummingbirds*, and I stopped for a breakfast burrito.',
      said: '「ハチドリにえさをやりに行く途中、ブリトーを買いに寄った」。',
      mean: 'on my way to ＝ 行く途中。stopped for ＝ 買いに寄った。',
      trap: 'burrito がはっきり聞こえ、行き先に取りやすい。行き先は on my way to のあと。',
      use: 'I stopped for coffee on my way here.（来る途中でコーヒーを買った）' },

    // R fix: V2, blind 60 %: "pushed" was the story already ruled out, and the key was the longest; now a log/creek
    //   keyword trap, and the key is the shortest-equal
    // why: dog ← "he lunged at a bird" is the loudest action; log ← "a log in the creek" is said, but it's where the
    //   burrito lands
    { id: 'd4', skill: 'detail', level: 'B2', point: 'fall', reveals: ['notmugged', 'reach'], seg: [146.6, 157.6],
      stem: 'How does Jerry say he hurt his shoulder?',
      choices: ['He slipped reaching for his food', 'His dog pulled him over chasing a bird',
                'He tripped on a log by the creek'], a: 0,
      cue: 'burrito を落としたあと、何をしようとしたか。',
      line: 'I go to *reach for it*, and I *lose my balance*, and I fall on my shoulder.',
      said: '犬が鳥に飛びかかってブリトーを落とし、取ろうとしてバランスを崩した。',
      mean: '襲われたのではなく、落とした食べ物を拾おうとした事故。',
      trap: 'lunged（飛びかかった）が強く聞こえ、犬のせいに取りやすい。けがの原因は reach for it から。',
      use: 'I lost my balance and fell.（バランスを崩して転んだ）' },

    // C2 dict: the narrative present right after a past verb, which grammar would "fix" to "landed"
    // anchor: 151.0–152.4 s both sources "I dropped the burrito and it lands on a log": past "dropped", then "lands"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'lands', reveals: ['fall'], seg: [149.65, 153.55],
      stem: 'Type the middle: “I dropped the burrito, and ___ log in the creek.” (4 words)', answer: 'it lands on a',
      cue: 'burrito のあと、log の前まで。時制より聞こえた音。',
      line: 'I dropped the burrito, and *it lands on a* log in the creek.',
      said: '「ブリトーを落としたら、丸太の上に落ちて」。lands on a が「ランゾナ」と一続き。',
      mean: '山場で過去形から現在形に切り替える語り方。臨場感を出す、会話ではよくある形。',
      trap: 'dropped に合わせて landed と書きたくなる。書き取りは文法でなく、聞こえた -s の音を書く。',
      use: 'So I walk in, and guess who’s there?（で、入ったら誰がいたと思う？）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'reach', reveals: ['fall'], seg: [153.2, 157.6],
      stem: 'Type what he does: “So I go to ___.” (3 words)', answer: 'reach for it',
      cue: 'creek のあと、So I go to に続く部分。',
      line: 'So I go to *reach for it*, and I lose my balance',
      said: '「だから、取ろうと手を伸ばして」。',
      mean: 'reach for ～ ＝ ～に手を伸ばす。for it は「フォリッ」とつながる。',
      trap: 'for と it がつながり、最後の t もほぼ聞こえない。reach のあとの短い音は for it と考える。',
      use: 'Can you reach that top shelf?（あの一番上の棚、届く？）' },

    // why: went to ← the story is in the past, so grammar expects "went"; got to ← weak "to" after a vowel sounds
    //   like "gotta" (ガラ)
    { id: 's1', skill: 'sound', level: 'B2', point: 'reach', reveals: ['fall'], seg: [153.2, 157.6],
      stem: 'Fill the gap: “So I ___ reach for it.”',
      choices: ['go to', 'got to', 'went to'], a: 0,
      cue: 'So I のすぐあと、とても短い2語。',
      line: 'So I *go to* reach for it',
      said: '「で、取ろうと手を伸ばす」と、今の形で話を進める。',
      mean: '過去の話でも、山場は現在形で語ることが多い。go to は弱く「ゴウタ」に近い。',
      trap: '過去の話なので went to、弱い to から got to を選びやすい。最初の母音「ゴウ」で判断。',
      use: 'So I go up and say hi.（で、近づいてあいさつするわけ）' },

    // R fix: S4/V1: the segment stopped at "Imagine what Tom would have said", so "make fun of him" rested on knowing
    //   Tom; it now runs through Tom's teasing (to 167.1 s, before the Klondike line) and reveals `tom`. V2, blind
    //   55 %: the money filler became a second Tom reading
    // why: never believe him ← "what Tom would have said" heard as doubt; tell the boss ← Tom's name, read as a
    //   tattletale
    { id: 'i3', skill: 'infer', level: 'B2', point: 'truth', reveals: ['tom'], seg: [157.3, 167.1],
      stem: 'Why didn’t Jerry tell everyone the truth, from his answer?',
      choices: ['He knew everyone would make fun of him', 'He thought Tom would never believe him',
                'He was afraid Tom would tell the boss'], a: 0,
      cue: '質問への返事の二文目、Imagine のあと。',
      line: 'Are you kidding me? *Imagine what Tom would have said.* — Damn, Jerry!…',
      said: '「本当のことを言えば？」に「冗談だろ。Tom に何を言われるか」。',
      mean: 'would have said ＝ 言っただろうこと。からかわれると分かっていた。',
      trap: 'Tom の名前から「告げ口」「信じない」を考えやすいが、Tom はからかうだけ。',
      use: 'Imagine what my mom would say!（母に何て言われるか！）' },

    // R fix: V2, blind 70 %: "feels sorry" was a filler; now a wrong-target reading (Leslie's story)
    // why: admires ← "Damn" heard as "wow"; Leslie ← the whole scene mocks her cover story, so the jab seems aimed at
    //   her
    { id: 'h3', skill: 'humor', level: 'C1', point: 'tom', reveals: ['truth', 'fall'], seg: [159.4, 167.1],
      stem: 'Why is Tom’s line right after Jerry’s answer funny?',
      choices: ['It’s exactly the teasing Jerry feared', 'Tom admires how far Jerry went for food',
                'Tom is really making fun of Leslie’s story'], a: 0,
      cue: 'Jerry の返事と、そのすぐあとの Tom の質問の最後。',
      line: 'Imagine what Tom would have said. — Damn, Jerry! You jumped in a creek *for a burrito*?',
      said: 'Tom が「小川に飛びこんだ？ブリトーのために？」とからかう。',
      mean: 'Jerry が恐れた反応が、そのまま次に出てくる。予言どおりのオチ。',
      trap: 'Damn を「すごい」と取ると感心に聞こえる。名前で呼ぶので、相手は Jerry。',
      use: 'You did all that for a free T-shirt?（タダのTシャツのためにそこまで？）' },

  ]
};
