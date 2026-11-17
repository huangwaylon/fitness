// REVIEW 2026-11-16: pass 9, fix 15, drop 2, new 0; ear checks 1
// REVIEW open: none. a1 and m1 were deleted on the assumption the bank hasn't shipped (no copy in ~/fitness-dev/app/src).
// “Parks and Recreation | Donna, Ben and Gary's Big Day (Episode Highlight)” (the official Parks and Recreation
// channel, Season 7 | Parks and Recreation): with the kids' stuffed zebras found, Ben asks Leslie whether he should run
// for office; at Donna's wedding reporters corner him and he ends up announcing he's running for Congress; Donna
// thanks him, a guest toasts himself, and the coworkers' "new name" for Gary turns out to be his real one.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈166.5 s, then music. Untested: 0–10 s
// who is on the phone with Roz (no name said), 56–59 s ("Hartwell C" vs "Harwell"), 92–95 s (a reaction line),
// 105.6 s ("mingle" vs "MIG" drama; the lines trim it), 115.9–117 s ("No!" is only in whisper), 128.5 s (whisper "how
// I'm wearing this dress", captions "Homer in this dress"; the lines trim it), 137–138 s (captions "to be" for "To
// Ben"). The guest at 139 s is left unnamed ("a guest").
// EAR CHECK: 127 s i5 nt3 — “Steal my thunder? … this dress?” is taken as Donna's (her wedding, Ben's “your thunder”
//   answers her “why didn't you tell us”); no name is said in the turn. The keys hold for anyone who is the bride.
import type { Clip } from '../types.ts';

export const bigDay: Clip = {
  id: 'bigday', video: 'v-xHE5KrLSY', title: 'Donna, Ben and Gary\'s Big Day (Episode Highlight)', dur: 188,
  wpm: 150, band: 'mid', tags: ['家', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: once home ← "the kids… coming back home" heard as the condition for the raise; day off ← "back home" plus
    //   the usual thank-you-for-babysitting script
    { id: 'd1', skill: 'detail', level: 'B1', point: 'raise', seg: [0.5, 10.88],
      stem: 'What does the caller promise Roz?',
      choices: ['A day off and a ride back home', 'A raise once the kids are back home',
                'A raise and anything from their house'], a: 2,
      cue: '「Also」のあと、二つ並べるところ。',
      line: 'we want to give you *a raise and anything you want to take from our house*.',
      said: 'シマウマが見つかり、電話の相手に「昇給と、家の物は何でも持っていって」と言う。',
      mean: 'それほど助かった、という大げさなお礼。条件は何も付けていない。',
      trap: '前の文の home が残って「子どもが帰ったら」とつなげやすい。Also は新しい話の合図。',
      use: 'Take anything you want from the fridge.（冷蔵庫の物、何でも食べてね）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'worry', seg: [2.8, 6.4],
      stem: 'Type what the caller says: “Tell the kids ___.” (3 words)', answer: 'not to worry',
      cue: '「Tell the kids」のすぐあと、短い3語。',
      line: 'Tell the kids *not to worry*. They’re coming back home.',
      said: '「子どもたちに心配しないでと伝えて」と言う。',
      mean: 'not to は t がつながり「ナットゥ」と短くなる。tell 人 not to ～ の形。',
      trap: 'not が弱いと to worry だけ残り、意味が逆に聞こえる。tell のあとの否定を探す。',
      use: 'Tell her not to wait for me.（待たなくていいって伝えて）' },

    // R fix: V2 (blind 70 %): the key was the only choice with a feeling in it; a "too busy right now" reading
    //   (the zebras, and what he later tells the reporters) replaces the "Leslie should run" filler
    // why: how a campaign works ← the question read literally, as a request for steps; too busy now ← "zebra emergency"
    //   heard as today's excuse (refuted: he goes straight on to "What do you think I should do?")
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'inworld', reveals: ['decide'], seg: [10.32, 21.36],
      stem: 'When Ben opens with “How in the world…”, what is he doing?',
      choices: ['Asking Leslie how a campaign would actually work', 'Saying he can’t see it working with their life',
                'Saying he’s too busy with the zebras to talk now'], a: 1,
      cue: 'in the world の強さと、すぐあとの生活の話。',
      line: 'How in the world am I supposed to *run for office*? Our lives are like one big… emergency.',
      said: '「いったいどうやって選挙に出ろと？生活はシマウマ騒ぎなのに」と言う。',
      mean: 'in the world で強めた反語。方法を聞くのでなく「無理だ」と言っている。',
      trap: '疑問文なので方法を聞いていると取りやすい。in the world が付いたら反語を疑う。',
      use: 'How on earth do I finish this?（こんなのどうやって終わらせるの？）' },

    // R fix: V2 (blind 70 %): "Whether Ben should run" was the bare, obvious key; all three choices are now about the run,
    //   and the key names the busy lives, so it reveals p1's point
    // why: now or later ← "How in the world am I supposed to…" heard as a timing worry (nobody mentions waiting);
    //   Leslie cuts back ← "our lives are… bonkers" plus "make it work" heard as one of them giving something up
    { id: 'g1', skill: 'gist', level: 'B1', point: 'decide', reveals: ['inworld'], seg: [10.32, 43.95],
      stem: 'What are Ben and Leslie trying to settle at the start?',
      choices: ['Whether Ben should run now or in a few years', 'Whether Leslie should cut back at work if he runs',
                'Whether Ben should run, busy as their lives are'], a: 2,
      cue: '最初の質問の主語と、最後の「you should」。',
      said: '男性が「どうやって選挙に出ろと？」と迷い、妻は中立と言いつつ「出るべき」と答える。',
      mean: '出るかどうか迷っているのは Ben。Leslie は背中を押す側。',
      trap: 'いつ出るか、だれが仕事を減らすかの話はない。迷うのは出るかどうか。I と you を追う。',
      use: 'Should I go for it?（思い切ってやるべきかな）' },

    // why: real zebras ← "zebras" heard (and "holding zebras" later), "stuffed" missed; zoo ← the busy-family picture
    //   many sitcoms use, built from "zebra" and "our lives"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'zebra', seg: [10.88, 18.3],
      stem: 'What makes Ben’s picture of their life funny?',
      choices: ['He says real zebras got loose at home', 'He compares their busy home to a zoo',
                'He calls a toy problem an “emergency”'], a: 2,
      cue: 'zebra の直前の形容詞と、最後の名詞。',
      line: 'Our lives are like one big, unexpected, *stuffed zebra emergency*.',
      said: '「生活は、予想外のぬいぐるみシマウマ緊急事態だ」と言う。',
      mean: 'stuffed ＝ ぬいぐるみの。おもちゃの騒ぎを emergency と呼ぶずれが笑い。',
      trap: 'zebra だけ聞くと本物の動物を想像しやすい。前の stuffed を聞き取る。',
      use: 'It’s a total laundry emergency.（洗濯物の大ピンチ）' },

    // R drop: a1 — the bank had 26 items (cap 24); a1 was guessable (blind 65 %: the only two-part, fond choice) and
    //   shares its point with nt2, which tests the same turn more deeply
    // C2: what she is holding back
    // R fix: V2 (blind 55 %): "already wants him to go for it" read as the obvious flip of "neutral"; the key is now
    //   "all along" and the first distractor names the kids, so the three are equal in weight
    // why: rather he stayed home ← "our lives are bonkers" heard as her real worry (right target, wrong direction); run
    //   herself ← "run for office" and her strong opinions heard as her own wish (wrong target)
    // anchor: 21.4 s "you have never been neutral on anything"; 28.7–37.8 s "Okay, fine. I think you should run… if
    //   something is worth it, and I think this is" — "Okay, fine" gives up a view she already had, and it is "you"
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'neutral', reveals: ['decide'], seg: [18.4, 38.5],
      stem: 'When Leslie says she’s neutral, what is she holding back?',
      choices: ['That she’d rather he stayed home with the kids', 'That she would like to run for office herself',
                'That she has wanted him to run all along'], a: 2,
      cue: '最後に折れるときの「Okay, fine」の働き。',
      line: 'I told you I’m *neutral*. … *Okay, fine. I think you should run.*',
      said: '中立と言っていたが、押されると「分かった、出るべきだと思う」と言い、理由まで並べる。',
      mean: 'Okay, fine は「じゃあ言うけど」と折れる合図。意見は前からあり、言わずにいただけ。',
      trap: '生活の心配を本音と取りやすい。折れた直後の一文が本音。中立宣言は意見を隠す前置きになりやすい。',
      use: 'Okay, fine, I’ll say it. Take the job.（分かった、言うよ。その仕事受けなよ）', retired: true },

    // R fix: V2 (blind 55 %): "proves him right the moment she says it" was shaped like a punchline; the three choices
    //   are now plain "She…" readings of the same length
    // why: changes the subject ← a reply about clothes heard as a way out; his clothes ← "pockets… bigger" heard as a
    //   dig at what he's wearing
    { id: 'h2', skill: 'humor', level: 'C1', point: 'pockets', reveals: ['neutral'], seg: [20.16, 28.6],
      stem: 'Why is Leslie’s answer about pockets funny?',
      choices: ['She changes the subject to get out of it', 'She backs up his point without meaning to',
                'She makes fun of the clothes he’s wearing'], a: 1,
      cue: '彼の「例」に、彼女がどう返すか。',
      line: 'You have an opinion on *pockets*. — *Yes, I think they should all be bigger.*',
      said: '「ポケットにも意見がある」と言われ、すぐ「全部もっと大きくすべき」と答える。',
      mean: '中立だと言った直後に、ポケットへの強い意見を出してしまう。自分で反証している。',
      trap: '服の話なので話をそらしたと取りやすい。答えが相手の言い分の証拠になっていないか見る。',
      use: 'Well, that proves my point.（ほら、言ったとおりでしょ）' },

    // R fix: V2 (blind 70 %): the key echoed the stem ("crazy or not") and "work harder" was weak; the new trap is
    //   "make it work" heard as "get help so the work gets done" (the nanny, Roz, is in the clip)
    // why: wait ← "our lives are bonkers" leads to "fix that first"; more help ← "make it work" read as getting the
    //   work covered
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'work', reveals: ['neutral'], seg: [30.56, 38.5],
      stem: 'After admitting their lives are crazy, what does Leslie say to do?',
      choices: ['Wait until their lives calm down a bit', 'Go for it and sort things out as they go',
                'Get more help so the work gets done'], a: 1,
      cue: '「then you just」のあとの3語。',
      line: 'if something is worth it… then you just *make it work*.',
      said: '「生活はめちゃくちゃでも、価値があるなら何とかする」と言う。',
      mean: 'make it work ＝ 条件が悪くても工夫してやり通す。働く話ではない。',
      trap: 'work を「仕事」と取ると、人手を増やす話に聞こえる。make it work は「何とかする」。',
      use: 'It’s tight, but we’ll make it work.（きついけど、何とかするよ）' },

    // R fix: V2 (blind 50 %): "Ben needs a rest" was easy to rule out; it's now a "too worn out to run" reading, the
    //   wrong direction for someone who just said "you should run"
    // why: too worn out ← "micro-naps" heard as a hint about his energy; lighter topic ← "Besides" heard as a topic
    //   change, not one more reason
    { id: 'i1', skill: 'infer', level: 'C1', point: 'naps', seg: [37.76, 43.95],
      stem: 'Why does Leslie mention an article she just read?',
      choices: ['She’s hinting he’s too worn out to run', 'She has a plan for when they’re short on sleep',
                'She’s moving the talk on to something lighter'], a: 1,
      cue: '記事の中身（何分の何か）と、その評価。',
      line: 'Besides, I just read an article on *two-minute micro-naps*… very promising.',
      said: '「それに、2分の超短い昼寝の記事を読んだの。科学的にも有望」と付け足す。',
      mean: '忙しくなっても短い仮眠で乗り切れる、と早くも対策を考えている。もう出る前提。',
      trap: 'nap から「疲れている」と取りやすい。Besides は話題を変えず、理由を一つ足す合図。',
      use: 'Besides, I read it’s good for you.（それに、体にいいって読んだし）' },

    // R fix: V2 (blind 85 %): the key was the only two-step answer; now all three are, and the strong trap is a listener
    //   who catches the record but misses the last line
    // why: won't say ← "the results speak for themselves" heard as the end of it; later ← "we're at a wedding" heard as
    //   "ask me later"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'pitch', reveals: ['decide'], seg: [43.95, 92.0],
      stem: 'How does Ben’s run-in with the reporters turn out?',
      choices: ['He waves them off and saves his answer for later', 'He defends his record, but won’t say if he’ll run',
                'He defends his record, then says he’s running'], a: 2,
      cue: '最初の断り方と、最後の自己紹介。',
      said: '最初は「今は話せない」と断るが、資格を問われると実績を語り、最後に立候補を宣言する。',
      mean: '記者の攻撃をきっかけに、断る場面が出馬表明に変わる流れ。',
      trap: '断りや実績の話で終わったと取りやすい。長い話は最後の一文で着地を確かめる。',
      use: 'Fine. You want an answer? Here it is.（いいよ、答えが欲しいなら言うよ）' },

    // R fix: V2 (blind 60 %, from show knowledge): the choices are now parallel in shape; K6 cue leak: the cue quoted
    //   "was", a word only the key had
    // why: lost ← "failed" read as "failed to become"; worked for a mayor ← "as a mayor" heard as "for a mayor"
    { id: 'd2', skill: 'detail', level: 'B2', point: 'mayor', seg: [48.48, 52.72],
      stem: 'What does the reporter say about Ben’s past in politics?',
      choices: ['He ran for mayor at 18 and lost', 'He worked for a mayor at 18 who failed',
                'He was mayor at 18 and did poorly'], a: 2,
      cue: 'mayor の直前の形容詞と、その前の短い語。',
      line: 'Your only experience in politics was as *a failed mayor* at age 18.',
      said: '「政治経験は、18歳でダメ市長だったことだけ」と記者が言う。',
      mean: 'a failed mayor ＝ 市長になったが、うまくいかなかった人。落選ではない。',
      trap: 'failed を「落ちた」と取りやすい。failed ＋職業は「その仕事で失敗した人」。',
      use: 'He’s a failed actor turned chef.（俳優で芽が出ずシェフになった人）' },

    // why: undecided ← he asked Leslie "what should I do?" earlier, so not deciding sounds right; call home ← the
    //   zebras and kids from the phone call
    { id: 'd3', skill: 'detail', level: 'B1', point: 'wedding', seg: [51.76, 56.8],
      stem: 'What reason does Ben give the reporters for stopping?',
      choices: ['He hasn’t decided yet whether he’ll run', 'He’s at a wedding, holding the zebras',
                'He has to call home about the kids'], a: 1,
      cue: '「please, everyone」のあと、and でつなぐ二つ。',
      line: 'we’re *at a wedding*, and I’m *holding zebras*.',
      said: '「みなさん、ここは結婚式で、僕はシマウマを抱えてるんです」と言う。',
      mean: '今は答える場面じゃない、という理由を二つ並べている。',
      trap: '迷っていた話が頭にあると「まだ決めてない」を選びやすい。言った理由だけで選ぶ。',
      use: 'Not now, I’m kind of busy here.（今はちょっと手がふさがってる）' },

    // R drop: m1 — over the 24-item cap; guessable (blind 70 %: x1's stem shows "Which, by the way", and the key was the
    //   only choice about his job), and x1 tests the same line

    { id: 'x1', skill: 'dict', level: 'B2', point: 'living', seg: [65.5, 69.6],
      stem: 'Type what Ben says: “Which, by the way, is ___.” (6 words)', answer: 'what i do for a living',
      cue: '「by the way, is」のあと、仕事の言い方。',
      line: 'Which, by the way, is *what I do for a living*.',
      said: '「ちなみに、それが僕の仕事です」と言う。',
      mean: 'what I do は「ワライドゥ」、for a は「ファラ」とつながる。do for a living ＝ 仕事にする。',
      trap: 'for a が一つの弱い音になり、語が足りなく聞こえやすい。a を数える。',
      use: 'So, what do you do for a living?（お仕事は何を？）' },

    // why: 9 ← "five" and "nine" share the long "ai" vowel; 15 ← "five years" heard as "fifteen" with the weak start lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'years5', seg: [69.6, 75.44], keep: true,
      stem: 'How long does Ben say he was city manager?',
      choices: ['5 years', '9 years', '15 years'], a: 0,
      cue: '「city manager」の少し前。',
      line: 'and for *five years* as city manager',
      said: '予算の専門家として、そして5年間シティマネージャーとして問題を解決してきた、と言う。',
      mean: 'for five years ＝ 5年間。実績を数字で示している。',
      trap: 'fifteen なら「ティーン」と長く伸びる。five は短く、すぐ years に続く。',
      use: 'I lived there for five years.（そこに5年住んでいました）' },

    // why: at this ← the flapped t of "at it" heard as a "th"; with it ← the weak "at" lost, and "with" filled in
    { id: 's1', skill: 'sound', level: 'B2', point: 'goodat', seg: [72.72, 76.08],
      stem: 'Fill the gap: “…city manager, and I’m ___.”',
      choices: ['pretty good at this', 'pretty good with it', 'pretty good at it'], a: 2,
      cue: 'pretty good のあと、とても短い2語。',
      line: 'and I’m *pretty good at it*.',
      said: '「それがけっこう得意なんです」と言う。',
      mean: 'pretty も at it も t が弾み、「プリディグッダディッ」のように一続きになる。',
      trap: '弾んだ t は「ラ」や「ダ」に近く、this にも聞こえやすい。th なら舌の摩擦が残る。',
      use: 'I’m pretty good at cooking.（料理はわりと得意です）' },

    // R fix: V2 (blind 65 %): "so smoothly it was almost dull" stood out against two disasters; now all three say how
    //   it went, and the key is plainer
    // why: family calmed down ← "everybody's just nice and chill" heard as the end of a fuss; a guest did ← "somebody was
    //   gonna do something crazy", with "thought for sure" missed
    { id: 'i3', skill: 'infer', level: 'B2', point: 'drama', seg: [103.0, 111.28],
      stem: 'What does Donna suggest about how the wedding went?',
      choices: ['It went well once her family calmed down', 'It went well, maybe a little too calmly',
                'It was fun because a guest did something crazy'], a: 1,
      cue: '「I thought for sure」と、そのあとの but。',
      line: 'I thought for sure somebody was gonna do something crazy, but *everybody’s just nice and chill*.',
      said: '「だれかやらかすと思ったのに、みんな穏やか」と言う。',
      mean: '騒ぎがなさすぎて少し物足りない、という冗談まじりの感想。',
      trap: 'something crazy だけ拾うと、起きた話と取りやすい。thought for sure は予想、but のあとが結果。',
      use: 'I was sure it would rain. It didn’t.（絶対雨だと思ったのに降らなかった）' },

    // why: drama ← "I kind of miss the… drama" just before, so the thanks seems to be for that; hug later ← "try not
    //   to hug you" heard as "try to hug you" (the weak "not" lost)
    // R fix: S3 cue leak: the cue quoted "thank you", words only the key's "thank-you" had
    { id: 'h3', skill: 'humor', level: 'C1', point: 'hug', reveals: ['drama'], seg: [110.48, 118.6],
      stem: 'What is funny about how Donna thanks Ben?',
      choices: ['She thanks him for drama she said she missed', 'She thanks him by promising a big hug later',
                'Her thank-you gift is simply not hugging him'], a: 2,
      cue: 'お礼をすると言ったあとと、彼の返事。',
      line: 'to thank you, I’m gonna *try not to hug you*. — *Thank you.*',
      said: '「お礼に、ハグしないよう頑張る」と言い、彼は「ありがとう」と返す。',
      mean: 'ハグしないことがお礼になり、彼もそれに感謝する。逆向きのプレゼント。',
      trap: 'not が弱く消えると「ハグする」と聞こえる。try not to の not を逃さない。',
      use: 'I’ll try not to cry.（泣かないようにするね）' },

    // R fix: V2 (blind 70 %): the key was the only choice about Donna; a "don't bore the bride with politics" reading
    //   replaces "undecided"
    // why: reporters ← "steal" taken literally (the press grabbing the story); bore Donna ← a wedding plus "thunder" not
    //   known as an idiom, so the reason sounds like politeness about politics
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'thunder', seg: [120.78, 128.16],
      stem: 'What reason is given for keeping the news quiet?',
      choices: ['Not to let the reporters get the story first', 'Not to bore Donna with politics at her wedding',
                'Not to pull the spotlight away from Donna'], a: 2,
      cue: '「Well, we didn’t want to」のあとの3語。',
      line: 'Well, we didn’t want to *steal your thunder*.',
      said: '「なぜ黙ってたの？」と聞かれ、「主役を奪いたくなかった」と答える。',
      mean: 'steal someone’s thunder ＝ 人の注目を横取りする。式の主役はドナ。',
      trap: 'steal を文字通りに取ると記者の話に見える。thunder は「注目」のたとえ。',
      use: 'I don’t want to steal your thunder.（あなたの見せ場を取りたくない）' },

    // C2: which reply would show he understood?
    // why: apology ← "why didn't you tell us" heard as the point, so an apology fits (i5's hurt reading); later ← the
    //   wedding setting heard as "not today" (i5's politics reading)
    // anchor: 127.0–129.9 s "Steal my thunder?" thrown back as a question, then "have you seen… this dress?": no news can
    //   upstage her; the clip's own next line (130.6 s, "in that case… yes, I am") confirms how Ben took it
    { id: 'nt3', skill: 'pragma', level: 'C2', point: 'dress', reveals: ['thunder', 'decide', 'pitch'], seg: [120.78, 130.1],
      stem: 'Which reply from Ben would match what Donna meant?',
      choices: ['Sorry! We should have told you first.', 'You’re right. We’ll talk after the party.',
                'Okay, fair enough. Then yes, I’m running.'], a: 2,
      cue: '彼女がくり返した語と、最後の問いの向き。',
      line: 'Steal *my* thunder? I’m sorry, have you seen … this dress?',
      said: '「主役を奪いたくなかった」と言われ、ドナは「私の主役を？このドレス姿を見た？」と問い返す。',
      mean: '答えの要らない問いで「心配無用、どうぞ」と許している。合う返事は、遠慮をやめて打ち明けること。',
      trap: 'なぜ言わなかったのかが頭に残り、謝る返事を選びやすい。返事は相手の最後の一言の意図に合わせる。',
      use: 'Well, in that case, yes.（それなら、はい、そうです）', retired: true },

    // R fix: V2 (blind 55 %): "No news of theirs could outshine her" was the only bold, quotable choice; the three are now
    //   plain "She…" readings
    // why: upset ← "why didn't you tell us" just before heard as the real complaint; politics ← a wedding plus "Steal my
    //   thunder?" heard as "not here, not now"
    { id: 'i5', skill: 'infer', level: 'C1', point: 'dress', reveals: ['thunder'], seg: [126.0, 130.1],
      stem: 'When Donna answers with a question about her dress, what does she mean?',
      choices: ['She’s upset they didn’t tell her sooner', 'She’d rather keep politics out of her day',
                'She’s sure nothing could upstage her today'], a: 2,
      cue: '相手の言葉をくり返す言い方と、最後の名詞。',
      line: 'Steal *my* thunder? I’m sorry, have you seen … this dress?',
      said: '「私の主役の座を奪う？ちょっと、このドレス姿を見た？」と返す。',
      mean: '答えの要らない問い。「何を発表しても私には勝てない」という自信。',
      trap: 'I’m sorry を謝罪や不満と取りやすい。ここは「ちょっと待って」という前置き。',
      use: 'Me, nervous? Have you met me?（私が緊張？私を知らないの？）' },

    // R fix: V2 (blind 70 %): "Annoyed that Ben got the first toast" was weak; a parody reading (he's mocking braggers)
    //   replaces it, and the key no longer says "happy to say so"
    // why: shy ← "To me" heard as a self-mocking joke (a Japanese 照れ frame); parody ← a boast this blunt at someone
    //   else's wedding heard as an act (refuted: "It's always worth celebrating" is said straight, no joke follows)
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'toast', seg: [136.8, 144.2],
      stem: 'How does the guest who toasts himself come across?',
      choices: ['Shy, so he hides it behind a joke', 'Sincere: he really thinks he deserves it',
                'Teasing, as a parody of people who brag'], a: 1,
      cue: '乾杯のあと、自分について並べる中身。',
      line: '*To me.* I own my own restaurant and several other properties. *It’s always worth celebrating.*',
      said: '人の結婚式で「自分に乾杯。店も不動産も持ってる。いつでも祝う価値がある」と言う。',
      mean: '照れ隠しではなく、本気で自分を祝っている。場違いな自信が笑いどころ。',
      trap: '自分に乾杯と聞くと自虐の冗談に取りやすい。続く自慢と always で本気と分かる。',
      use: 'Here’s to us!（私たちに乾杯！）' },

    // C2: the talking head against the scene
    // R fix: V2 (blind 55 %) / S1: the stem called him "Gary", which gives away that the "new name" is his own
    // why: kind nickname ← "your new name" heard as a friendly gift, and he is happy about it (right feeling, wrong
    //   reason); stings ← "Ha-ha" and the chant heard as cruel, with "I'm blessed" taken as sarcasm
    // anchor: 149.8 s "Ha-ha, that's your new name, Gary" against 158.0–164.0 s to camera "Gary is my real name… finally
    //   going to call me by my real name"
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'gary', seg: [145.4, 166.9],
      stem: 'After his comment to the camera, how should we hear “that’s your new name”?',
      choices: ['As teasing that stings: he hates the name', 'As a kind nickname they know he’ll love',
                'As teasing that misfires: it’s his real name'], a: 2,
      cue: '場面の「新しい名前」と、カメラへの一言。',
      line: 'Ha-ha, that’s your *new name*, Gary. … *Gary is my real name.*',
      said: '同僚は「新しい名前はゲイリー」と笑うが、本人はカメラに「それが本名。やっと本名で呼ばれる」と話す。',
      mean: 'カメラへの一言が場面を書きかえる。からかいのつもりが本名を当てていた。笑われるのは同僚の側。',
      trap: '笑い声だけで、からかわれて傷ついたと取りやすい。この形式では、カメラへの一言が答え合わせ。',
      use: 'Joke’s on you. That’s my real name.（おあいにくさま、それ本名だから）', retired: true },

    // R fix: V2 (blind 55 %), K6: the key was the only choice without "but"; now three "feeling; reason" choices
    // why: hurt ← "Oh boy, I'm blessed" heard as dry sarcasm; annoyed ← the chant ("Gary! Gary!") heard as mockery he
    //   has to put up with
    { id: 'a4', skill: 'attitude', level: 'B2', point: 'gary', seg: [157.76, 166.9],
      stem: 'How does Gary feel about what his coworkers are now calling him?',
      choices: ['Hurt; they’re laughing at him again', 'Delighted; it’s been a long time coming',
                'Annoyed; it’s a name he never liked'], a: 1,
      cue: '「finally」と、最後のひと言。',
      line: 'my coworkers are *finally* going to call me by my real name. *Oh, boy, I’m blessed.*',
      said: '「同僚がやっと本当の名前で呼んでくれる。ああ、ありがたい」とカメラに話す。',
      mean: 'finally は待ち望んだことに使う。心から喜んでいる。',
      trap: 'I’m blessed を皮肉と取りやすい。前の finally が本気のサイン。',
      use: 'Finally, a day off. I’m so lucky.（やっと休み。ついてる）' },

    // why: 13 ← "thirty" and "thirteen" share the start, and the stress is easy to miss; 3 ← "years" after a short
    //   number word
    { id: 'n2', skill: 'number', level: 'B1', point: 'years30', reveals: ['gary'], seg: [158.96, 164.6], keep: true,
      stem: 'In his comment to the camera, how long does Gary say it has taken?',
      choices: ['3 years', '13 years', '30 years'], a: 2,
      cue: '「After」のすぐあとの数字。',
      line: 'After *30 years*, my coworkers are finally going to call me by my real name.',
      said: '「30年たって、同僚がやっと本当の名前で呼んでくれる」と言う。',
      mean: 'thirty は最初が強い。長年まちがった名前で呼ばれてきたことが分かる。',
      trap: 'thirteen は後ろの「ティーン」が強く長い。強さの位置で -ty と -teen を聞き分ける。',
      use: 'After ten years, I finally visited Kyoto.（10年越しにやっと京都へ）' }
  ]
};
