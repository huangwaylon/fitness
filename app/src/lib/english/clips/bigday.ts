// A2 REVIEW 2026-11-17: keep 5, rewrite 13, retire 3, new 2
// “Parks and Recreation | Donna, Ben and Gary's Big Day (Episode Highlight)” (the official Parks and Recreation
// channel, Season 7 | Parks and Recreation): with the kids' stuffed zebras found, Ben asks Leslie whether he should run
// for office; at Donna's wedding reporters corner him and he ends up announcing he's running for Congress; Donna
// thanks him, a guest toasts himself, and the coworkers' "new name" for Gary turns out to be his real one.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈166.5 s, then music. Untested: 0–10 s
// (who is on the phone with Roz), 56–59 s, 92–95 s, 105.6 s, 113–118 s (the hug), 127–130 s (Donna's dress line),
// 137–138 s. The guest at 139 s is left unnamed ("a guest").
import type { Clip } from '../types.ts';

export const bigDay: Clip = {
  id: 'bigday', video: 'v-xHE5KrLSY', title: 'Donna, Ben and Gary\'s Big Day (Episode Highlight)', dur: 188,
  wpm: 150, band: 'mid', tags: ['家', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    { id: 'd1', skill: 'detail', level: 'B1', point: 'raise', seg: [1.3, 13.3],
      stem: 'What does the caller promise Roz?', ja: '電話の人は、ロズに何を約束する？',
      choices: ['A raise and things from home', 'A day off and a ride', 'A raise once kids are home'], a: 0,
      choicesJa: ['昇給と、家の物を何でも', '休みと、車での送り', '子どもが帰ったら昇給'],
      cue: '「Also」のあと',
      line: 'we want to give you *a raise and anything you want to take from our house*.',
      said: 'シマウマが見つかり、電話の相手に「昇給と、家の物は何でも持っていって」と言う。',
      mean: 'give you a raise ＝ 給料を上げる。それほど助かった、という大げさなお礼。',
      trap: '前の文の home が残って、「子どもが帰ったら」とつなげやすい。Also は新しい話の合図。',
      use: 'Take anything you want from the fridge.（冷蔵庫の物、何でも食べてね）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'worry', seg: [2.4, 10.4],
      stem: 'Type what the caller says: “Tell the kids ___.” (3 words)', ja: '書こう：“Tell the kids ___.”（3語）',
      answer: 'not to worry',
      cue: '「Tell the kids」のすぐあと',
      line: 'Tell the kids *not to worry*. They’re coming back home.',
      said: '「子どもたちに心配しないでと伝えて」と言う。',
      mean: 'tell 人 not to 〜 ＝ 人に〜しないように言う。not to は「ナットゥ」と短い。',
      trap: 'not が弱いと to worry だけ残り、意味が逆に聞こえる。tell のあとの not を探す。',
      use: 'Tell her not to wait for me.（待たなくていいって伝えて）' },

    { id: 'p1', skill: 'pragma', level: 'B2', point: 'inworld', seg: [9.4, 18.3],
      stem: 'What does Ben mean by “How in the world…?”', ja: 'ベンの “How in the world…?” はどういう意味？',
      choices: ['He thinks it can’t work', 'He asks how campaigns work', 'He is too busy to talk'], a: 0,
      choicesJa: ['うまくいくはずがないと思う', '選挙のやり方を聞いている', '忙しくて話せない'],
      cue: '最初の質問と、すぐあとの生活の話',
      line: 'How in the world am I supposed to *run for office*? Our lives are like one big… emergency.',
      said: '「いったいどうやって選挙に出ろと？生活はシマウマ騒ぎなのに」と言う。',
      mean: 'How in the world 〜? ＝ いったいどうやって〜？ 方法を聞くのではなく「無理だ」と言っている。',
      trap: '質問の形なので、やり方を聞いていると思いやすい。in the world が付くと「無理でしょ」。',
      use: 'How in the world do I finish this?（こんなのどうやって終わらせるの？）' },

    { id: 'g1', skill: 'gist', level: 'B1', point: 'decide', seg: [10.3, 44],
      stem: 'What are Ben and Leslie trying to decide?', ja: 'ベンとレスリーは、何を決めようとしている？',
      choices: ['Whether Ben should run for office', 'When Ben should run for office', 'Whether Leslie should quit work'], a: 0,
      choicesJa: ['ベンが選挙に出るかどうか', 'ベンがいつ選挙に出るか', 'レスリーが仕事をやめるかどうか'],
      cue: '最初の質問と、最後の「you should」',
      line: 'What do you think I should do? … Okay, fine. *I think you should run.*',
      said: 'ベンが「どうやって選挙に出ろと？」と迷い、レスリーは中立と言いつつ「出るべき」と答える。',
      mean: 'run for office ＝ 選挙に出る。迷っているのはベン。レスリーは背中を押す側。',
      trap: 'いつ出るか、誰が仕事を減らすかの話はない。I think you should run を聞く。',
      use: 'Should I go for it?（思い切ってやるべきかな）' },

    // why: real zebras ← "zebras" heard (and "holding zebras" later), "stuffed" missed; zoo ← the busy-family picture
    //   many sitcoms use, built from "zebra" and "our lives"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'zebra', seg: [10.88, 18.3], retired: true,
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

    { id: 'h2', skill: 'humor', level: 'B1', point: 'pockets', seg: [20.2, 30.1],
      stem: 'What does Leslie say about pockets?', ja: 'レスリーはポケットについて何と言う？',
      choices: ['They should all be bigger', 'They should be smaller', 'She has no opinion'], a: 0,
      choicesJa: ['全部もっと大きくすべき', 'もっと小さくすべき', '意見はない'],
      cue: '「You have an opinion on pockets」のあと',
      line: 'You have an opinion on *pockets*. — *Yes, I think they should all be bigger.*',
      said: '「ポケットにも意見がある」と言われ、すぐ「全部もっと大きくすべき」と答える。',
      mean: 'opinion ＝ 意見。「中立」と言った直後に、ポケットへの強い意見を言ってしまうのが笑い。',
      trap: '直前に I’m neutral（中立）と言うので、意見はないと思いやすい。すぐ Yes と答える。',
      use: 'In my opinion, it should be bigger.（私の意見では、もっと大きくすべき）' },

    { id: 'f1', skill: 'phrase', level: 'B1', point: 'work', seg: [30.6, 38.5],
      stem: 'What does “make it work” mean?', ja: '“make it work” はどういう意味？',
      choices: ['Find a way to do it', 'Work much harder', 'Wait until much later'], a: 0,
      choicesJa: ['何とかやる方法を見つける', 'もっと働く', 'あとまで待つ'],
      cue: '「then you just」のあと',
      line: 'if something is worth it… then you just *make it work*.',
      said: '「生活はめちゃくちゃでも、価値があるなら何とかする」と言う。',
      mean: 'make it work ＝ 条件が悪くても、工夫してやり通す。働く話ではない。',
      trap: 'work を「仕事」と思うと、もっと働く話に聞こえやすい。make it work で「何とかする」。',
      use: 'It’s tight, but we’ll make it work.（きついけど、何とかするよ）' },

    { id: 'i1', skill: 'marker', level: 'B2', point: 'naps', seg: [37.76, 43.95],
      stem: 'What does “Besides” mean here?', ja: 'ここでの “Besides” はどういう意味？',
      choices: ['Also, one more reason', 'Instead of doing that', 'Next to me'], a: 0,
      choicesJa: ['それに、もう一つの理由', 'その代わりに', '私のとなりに'],
      cue: '文の最初の一語',
      line: '*Besides*, I just read an article on two-minute micro-naps… very promising.',
      said: '「それに、2分の超短い昼寝の記事を読んだの。科学的にも有望」と付け足す。',
      mean: 'Besides ＝ それに、そのうえ。理由をもう一つ足す合図。忙しくても短い昼寝で乗り切れる、という話。',
      trap: 'beside（〜のとなりに）と似ていて、場所の話だと思いやすい。s が付いた文頭の Besides は「それに」。',
      use: 'Besides, it’s too late to go out.（それに、出かけるにはもう遅い）' },

    { id: 'pr2', skill: 'pragma', level: 'B1', point: 'cantalk', seg: [43.2, 52.5],
      stem: 'Why does Ben say “I can’t talk about this”?', ja: 'ベンはなぜ「I can’t talk about this」と言う？',
      choices: ['To say no to answering now', 'To give a full answer', 'To ask them a question'], a: 0,
      choicesJa: ['今は答えないと断るため', 'しっかり答えるため', '記者に質問するため'],
      cue: '記者の質問への答え',
      line: 'any comment on the report that you’re running for Congress? — *I’m sorry, I can’t talk about this right now.*',
      said: '「出馬の話についてコメントは？」と聞かれ、「すみません、今は話せません」と答える。',
      mean: 'I can’t talk about this right now ＝ 今は話せない。ていねいに答えを断る決まった言い方。',
      trap: 'I’m sorry で謝っていると思いやすい。ここは断りの前置き。',
      use: 'Sorry, I can’t talk right now.（ごめん、今は話せない）' },

    { id: 'd2', skill: 'detail', level: 'B2', point: 'mayor', seg: [46.8, 52.2],
      stem: 'What does the reporter say about Ben’s past?', ja: '記者は、ベンの過去について何と言う？',
      choices: ['He was a mayor who did badly', 'He lost a race for mayor', 'He worked for a mayor'], a: 0,
      choicesJa: ['市長になったが、うまくいかなかった', '市長選に落ちた', '市長の下で働いた'],
      cue: '「mayor」の前',
      line: 'Your only experience in politics was as *a failed mayor* at age 18.',
      said: '「政治経験は、18歳でダメ市長だったことだけ」と記者が言う。',
      mean: 'a failed mayor ＝ 市長になったが、うまくいかなかった人。落選ではない。',
      trap: 'failed を「落ちた」と思いやすい。failed ＋仕事は「その仕事で失敗した人」。',
      use: 'He’s a failed actor turned chef.（俳優で芽が出ずシェフになった人）' },

    { id: 'g2', skill: 'gist', level: 'B1', point: 'pitch', seg: [47.0, 92.0],
      stem: 'How does Ben’s talk with the reporters end?', ja: 'ベンと記者たちの話は、どう終わる？',
      choices: ['He says he’s running', 'He refuses to say anything', 'He only talks about his past'], a: 0,
      choicesJa: ['出馬すると言う', '何も言わない', '過去の話だけする'],
      cue: '最後の自己紹介',
      line: 'My name is Ben Wyatt, and *I’m running for Congress*.',
      said: '最初は「今は話せない」と断るが、資格を問われると実績を語り、最後に立候補を宣言する。',
      mean: 'I’m running for Congress ＝ 議会選挙に出る。断る場面が、出馬の宣言に変わる。',
      trap: '断りや実績の話で終わると思いやすい。最後の一文 My name is Ben Wyatt… を聞く。',
      use: 'Fine. You want an answer? Here it is.（いいよ、答えが欲しいなら言うよ）' },

    { id: 'd3', skill: 'detail', level: 'B1', point: 'wedding', seg: [51.3, 56.3],
      stem: 'Why does Ben want the reporters to stop?', ja: 'ベンはなぜ、記者にやめてほしい？',
      choices: ['He’s busy at a wedding', 'He hasn’t decided yet', 'He must call home'], a: 0,
      choicesJa: ['結婚式で手がふさがっている', 'まだ決めていない', '家に電話しないといけない'],
      cue: '「please, everyone」のあと',
      line: 'we’re *at a wedding*, and I’m *holding zebras*.',
      said: '「みなさん、ここは結婚式で、僕はシマウマを抱えてるんです」と言う。',
      mean: 'hold ＝ 抱える、持つ。今は答える場面じゃない、という理由を二つ並べている。',
      trap: '迷っていた話が頭にあると、「まだ決めていない」を選びやすい。言った理由だけで選ぶ。',
      use: 'Not now, my hands are full.（今は手がふさがってる）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'living', seg: [63.8, 68.8],
      stem: 'Type what Ben says: “Which, by the way, is ___.” (6 words)', ja: '書こう：“Which, by the way, is ___.”（6語）',
      answer: 'what i do for a living',
      cue: '「by the way, is」のあと',
      line: 'Which, by the way, is *what I do for a living*.',
      said: '「ちなみに、それが僕の仕事です」と言う。',
      mean: 'do 〜 for a living ＝ 〜を仕事にする。what I do は「ワライドゥ」、for a は「ファラ」。',
      trap: 'for a が一つの弱い音になり、語が足りなく聞こえやすい。a を数える。',
      use: 'So, what do you do for a living?（お仕事は何を？）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'years5', seg: [68.7, 75.4], keep: true,
      stem: 'How long was Ben city manager, he says?', ja: 'ベンはシティマネージャーを何年やった？',
      choices: ['5 years', '9 years', '15 years'], a: 0,
      choicesJa: ['5年', '9年', '15年'],
      cue: '「city manager」の少し前',
      line: 'and for *five years* as city manager',
      said: '予算の専門家として、そして5年間シティマネージャーとして問題を解決してきた、と言う。',
      mean: 'for five years ＝ 5年間。実績を数字で示している。',
      trap: 'fifteen なら「ティーン」と長く伸びる。nine は「ナイン」。短い「ファイヴ」がすぐ years に続く。',
      use: 'I lived there for five years.（そこに5年住んでいました）' },

    { id: 's1', skill: 'sound', level: 'B2', point: 'goodat', seg: [68.7, 75.4],
      stem: 'Fill the gap: “…city manager, and I’m ___.”', ja: '空所に入るのは？ “…city manager, and I’m ___.”',
      choices: ['pretty good at this', 'pretty good with it', 'pretty good at it'], a: 2,
      choicesJa: ['これがけっこう得意', 'それの扱いがけっこう上手', 'それがけっこう得意'],
      cue: '「pretty good」のあと',
      line: 'and I’m *pretty good at it*.',
      said: '「それがけっこう得意なんです」と言う。',
      mean: 'be good at 〜 ＝ 〜が得意。pretty も at it も t が軽い「ラ」の音で、「プリディグッダディッ」。',
      trap: 'this なら舌を歯にあてる「ズィス」、with なら「ウィ」。短い「アディッ」なら at it。',
      use: 'I’m pretty good at cooking.（料理はわりと得意です）' },

    { id: 'f4', skill: 'phrase', level: 'B1', point: 'miracle', seg: [96.7, 106.8],
      stem: 'What does “You are a miracle worker” mean?', ja: '“You are a miracle worker” はどういう意味？',
      choices: ['You did amazing work', 'You work at a church', 'You work too hard'], a: 0,
      choicesJa: ['すばらしい仕事をした', '教会で働いている', '働きすぎ'],
      cue: '「How did I do?」への返事',
      line: 'Hey, how did I do? — Everything was perfect. *You are a miracle worker.*',
      said: '「どうだった？」と聞かれ、「全部完璧。あなたは奇跡を起こす人ね」と答える。',
      mean: 'miracle worker ＝ 奇跡を起こす人。無理そうなことをやってのけた人をほめる言い方。',
      trap: 'miracle（奇跡）から、宗教の話だと思いやすい。Everything was perfect に続くほめ言葉。',
      use: 'You fixed it? You’re a miracle worker!（直したの？すごい！）' },

    { id: 'i3', skill: 'infer', level: 'B2', point: 'drama', seg: [103, 111.2],
      stem: 'How did the wedding go, says Donna?', ja: 'ドナによると、結婚式はどうだった？',
      choices: ['Well, but maybe too calm', 'Badly, a guest went crazy', 'Well, after a family fight'], a: 0,
      choicesJa: ['よかったが、少し穏やかすぎ', 'ひどかった、客が暴れた', 'よかった、家族げんかのあとで'],
      cue: '「I thought for sure」と but のあと',
      line: 'I thought for sure somebody was gonna do something crazy, but *everybody’s just nice and chill*.',
      said: '「誰かやらかすと思ったのに、みんな穏やか」と言う。',
      mean: 'chill ＝ 落ち着いている（くだけた言い方）。騒ぎがなさすぎて少し物足りない、という冗談まじりの感想。',
      trap: 'something crazy だけ拾うと、本当に起きたと思いやすい。I thought for sure は予想で、but のあとが結果。',
      use: 'I was sure it would rain, but it didn’t.（絶対雨だと思ったのに降らなかった）' },

    // why: drama ← "I kind of miss the… drama" just before, so the thanks seems to be for that; hug later ← "try not
    //   to hug you" heard as "try to hug you" (the weak "not" lost)
    // R fix: S3 cue leak: the cue quoted "thank you", words only the key's "thank-you" had
    { id: 'h3', skill: 'humor', level: 'C1', point: 'hug', reveals: ['drama'], seg: [110.48, 118.6], retired: true,
      stem: 'What is funny about how Donna thanks Ben?',
      choices: ['She thanks him for drama she said she missed', 'She thanks him by promising a big hug later',
                'Her thank-you gift is simply not hugging him'], a: 2,
      cue: 'お礼をすると言ったあとと、彼の返事。',
      line: 'to thank you, I’m gonna *try not to hug you*. — *Thank you.*',
      said: '「お礼に、ハグしないよう頑張る」と言い、彼は「ありがとう」と返す。',
      mean: 'ハグしないことがお礼になり、彼もそれに感謝する。逆向きのプレゼント。',
      trap: 'not が弱く消えると「ハグする」と聞こえる。try not to の not を逃さない。',
      use: 'I’ll try not to cry.（泣かないようにするね）' },

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

    { id: 'f3', skill: 'phrase', level: 'B2', point: 'thunder', seg: [120.8, 130.4],
      stem: 'What does “steal your thunder” mean?', ja: '“steal your thunder” はどういう意味？',
      choices: ['Take attention away from you', 'Give your story to reporters', 'Spoil your wedding food'], a: 0,
      choicesJa: ['あなたから注目を奪う', '記者にあなたの話を渡す', '結婚式の料理をだめにする'],
      cue: '「we didn’t want to」のあと',
      line: 'why didn’t you tell us…? — Well, we didn’t want to *steal your thunder*.',
      said: '「なぜ黙ってたの？」と聞かれ、「主役の座を奪いたくなかった」と答える。',
      mean: 'steal someone’s thunder ＝ 人の注目を横取りする。今日の主役は花嫁のドナ。',
      trap: 'steal（盗む）や thunder（雷）を字のまま取ると、意味が通らない。thunder は「注目」のたとえ。',
      use: 'I don’t want to steal your thunder.（あなたの見せ場を取りたくない）' },

    // R fix: V2 (blind 55 %): "No news of theirs could outshine her" was the only bold, quotable choice; the three are now
    //   plain "She…" readings
    // why: upset ← "why didn't you tell us" just before heard as the real complaint; politics ← a wedding plus "Steal my
    //   thunder?" heard as "not here, not now"
    { id: 'i5', skill: 'infer', level: 'C1', point: 'dress', reveals: ['thunder'], seg: [126.0, 130.1], retired: true,
      stem: 'When Donna answers with a question about her dress, what does she mean?',
      choices: ['She’s upset they didn’t tell her sooner', 'She’d rather keep politics out of her day',
                'She’s sure nothing could upstage her today'], a: 2,
      cue: '相手の言葉をくり返す言い方と、最後の名詞。',
      line: 'Steal *my* thunder? I’m sorry, have you seen … this dress?',
      said: '「私の主役の座を奪う？ちょっと、このドレス姿を見た？」と返す。',
      mean: '答えの要らない問い。「何を発表しても私には勝てない」という自信。',
      trap: 'I’m sorry を謝罪や不満と取りやすい。ここは「ちょっと待って」という前置き。',
      use: 'Me, nervous? Have you met me?（私が緊張？私を知らないの？）' },

    { id: 'a3', skill: 'attitude', level: 'B2', point: 'toast', seg: [136.8, 144.3],
      stem: 'How does the guest who toasts himself sound?', ja: '自分に乾杯する客は、どう聞こえる？',
      choices: ['Proud, and he means it', 'Shy, hiding it in a joke', 'Teasing people who brag'], a: 0,
      choicesJa: ['得意げで、本気', '照れて、冗談でごまかす', '自慢する人をからかっている'],
      cue: '乾杯のあとの自分の話',
      line: '*To me.* I own my own restaurant and several other properties. *It’s always worth celebrating.*',
      said: '人の結婚式で「自分に乾杯。店も不動産も持ってる。いつでも祝う価値がある」と言う。',
      mean: 'To 〜 ＝ 〜に乾杯。照れ隠しではなく、本気で自分を祝っている。場ちがいな自信が笑いどころ。',
      trap: '自分に乾杯と聞くと、冗談だと思いやすい。続く自慢と always で本気だと分かる。',
      use: 'To us!（私たちに乾杯！）' },

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

    { id: 'n2', skill: 'number', level: 'B1', point: 'years30', seg: [157.6, 167], keep: true,
      stem: 'How long has it taken, says Gary?', ja: 'ゲーリーによると、何年かかった？',
      choices: ['3 years', '13 years', '30 years'], a: 2,
      choicesJa: ['3年', '13年', '30年'],
      cue: '「After」のすぐあと',
      line: 'After *30 years*, my coworkers are finally going to call me by my real name.',
      said: '「30年たって、同僚がやっと本当の名前で呼んでくれる」と言う。',
      mean: 'after 30 years ＝ 30年たって。thirty は前の「サー」が強い。',
      trap: 'thirteen なら後ろの「ティーン」が強く長い。three なら「スリー」だけ。前が強ければ30。',
      use: 'After ten years, I finally visited Kyoto.（10年越しにやっと京都へ）' },

    { id: 'a4', skill: 'attitude', level: 'B1', point: 'gary', seg: [157.8, 167.7],
      stem: 'How does Gary feel about his name now?', ja: '今の名前の呼ばれ方を、ゲーリーはどう思う？',
      choices: ['Very happy, at last', 'Hurt, being laughed at', 'Annoyed, he hates it'], a: 0,
      choicesJa: ['やっとで、とてもうれしい', '笑われて傷ついている', 'その名前が嫌いでいらいら'],
      cue: '「finally」と最後の一言',
      line: 'my coworkers are *finally* going to call me by my real name. *Oh, boy, I’m blessed.*',
      said: '「同僚がやっと本当の名前で呼んでくれる。ああ、ありがたい」とカメラに話す。',
      mean: 'finally ＝ やっと。I’m blessed ＝ ありがたい、恵まれている。心から喜んでいる。',
      trap: 'I’m blessed を皮肉だと思いやすい。前の finally が本気のしるし。',
      use: 'Finally, a day off. I’m so lucky.（やっと休み。ついてる）' },
  ]
};
