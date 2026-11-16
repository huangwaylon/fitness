// REVIEW 2026-11-16: pass 5, fix 14, drop 0, new 0; ear checks 0
//   Open: g1's key ("hiring someone new") hints at i2/nt2 ("No!" is about hiring). It's left unlisted in reveals,
//   since a gist that reveals 'no' would keep both off every draw; i2 still turns on hearing what "that" points to.
//   Blind pass ran on stems + choices only (header unread); 15 of 18 choice items were ≥ 50 % and right.
// “Parks and Recreation | Ron's Tough Decision (Episode Highlight)” (the official Parks and Recreation channel,
// Season 4): Chris does upside-down sit-ups in Ron's office, then asks why the Parks Department has only seven people;
// with Leslie running for City Council, he wants a deputy director unless Ron's team finishes one major project, and
// Ron, to camera, weighs two options he hates.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈79 s. Untested: 13.1 s (“Ron” vs “rod”),
// 15.6–21.4 s (“Could you hold me while I dismount?” vs “hold me well I just spell”, then a gap), 30.3 s (“Why is that?”
// vs “ways that”), whether Chris's 35–48 s turn is to Ron or to camera, and 64–79 s beyond why the ending gets a laugh.
// EAR CHECK: none (every key rests on words both sources agree on)
import type { Clip } from '../types.ts';

export const ronTough: Clip = {
  id: 'rontough', video: '-lu985jOKRc', title: 'Parks and Recreation | Ron\'s Tough Decision (Episode Highlight)',
  dur: 90, wpm: 153, band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %): the key's abstract wording stood out. Three parallel "His “…”…" readings.
    // why: misuse ← "literally" is famous for being misused, so a learner suspects that joke; dizzy ← upside down
    //   plus "see the world" heard as a complaint about the view
    { id: 'h1', skill: 'humor', level: 'C1', point: 'literally', seg: [0, 8.65],
      stem: 'What is funny about how Chris sells his upside-down sit-ups?',
      choices: ['His “new view” saying is, for once, exactly true', 'His “literally” is misused to mean “in a way”',
                'His “new view” is a hint that it makes him dizzy'], a: 0,
      cue: '「literally」のあとの決まり文句と、運動の形。',
      line: 'it *literally* lets me *see the world from a different perspective*.',
      said: '逆さ腹筋を「いい運動で、文字どおり世界を違う角度から見られる」と言う。',
      mean: '「違う視点で見る」はふつう比ゆ。逆さの今は本当にそのとおり、というずらし。',
      trap: 'literally の誤用はよくある冗談だが、ここは正しい使い方。逆さで本当に違う角度。',
      use: 'This trip literally changed my view.（この旅で、文字どおり見方が変わった）' },

    // R fix: V2 (blind 70 %): "join a gym with him" was weak. Now a helpful tip (the Japanese polite-suggestion
    //   frame); the segment starts at 0 so "what the hell are you doing?" is in it.
    // why: asking ← the line is a question, so learners answer it as one; a better gym ← "Isn't there…?" heard as a
    //   kind suggestion (〜はどう？)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'gym', reveals: ['isnt'], seg: [0, 11.9],
      stem: 'When Ron asks about a men’s gymnasium, what is he really doing?',
      choices: ['Telling Chris to take it somewhere else', 'Pointing Chris to a gym with better gear',
                'Asking whether the city has a men’s gym'], a: 0,
      cue: '否定で始まる質問の形と、最後の that。',
      line: '*Isn’t there* a men’s gymnasium *where you could do that*?',
      said: '「男性用のジムがあるだろう、そこでやったらどうだ」と言う。',
      mean: 'Isn’t there…? は答えを知っている質問。「ここでやるな」という遠回しな注意。',
      trap: '疑問文なので場所を聞いているように見えるが、Isn’t で始まる質問は意見の形。',
      use: 'Isn’t there a quieter place to talk?（もっと静かな所で話さない？）' },

    // R fix: §9.5 + V2 (blind 50 %): "Aren't there a…" isn't grammatical, so it's cut.
    // why: Is there ← the n't is lost before "there"; Wasn't there ← the n is heard, the vowel isn't
    { id: 's1', skill: 'sound', level: 'B2', point: 'isnt', reveals: ['gym'], seg: [4.4, 11.9],
      stem: 'Fill the gap: “___ a men’s gymnasium where you could do that?”',
      choices: ['Is there', 'Isn’t there', 'Wasn’t there'], a: 1,
      cue: '文の最初、とても短い2語。',
      line: '*Isn’t there* a men’s gymnasium…?',
      said: '「男性用のジムがあるでしょう？」と、ここでやる理由を問う。',
      mean: 'Isn’t there が「イズンゼア」のようにつながる。t は消え、「ン」だけが残る。',
      trap: 'Is there だと純粋な質問になる。弱い「ン」が、相手を責める調子を決めている。',
      use: 'Isn’t there a later train?（もっと遅い電車はないの？）' },

    // why: agrees, then asks Ron ← "gymnasium" repeated sounds like agreement; apologizes ← "uncomfortable" heard as
    //   an apology (すみません), with "Could you hold me" taken as carrying on
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'stop', seg: [4.4, 15.6],
      stem: 'How does Chris react to Ron’s complaint about where he exercises?',
      choices: ['He brushes it off, then offers to stop', 'He agrees, then asks Ron to join him',
                'He apologizes, then keeps going anyway'], a: 0,
      cue: '大きな一言のあとの「But」。',
      line: '*The world’s my gymnasium*, Ron. *But I will stop* if it makes you feel uncomfortable.',
      said: '「世界が僕のジムだよ、ロン。でも君が落ち着かないならやめるよ」と言う。',
      mean: 'まず大きく言い返し、but のあとで相手に合わせる。人のいい性格が出ている。',
      trap: 'uncomfortable で謝ったと取りやすいが、前半は言い返し。but の前後で分ける。',
      use: 'I’ll stop if it bothers you.（気になるならやめるよ）' },

    // why: seven ← the number Ron's department has, said right after; eleven ← near sound of seven/ten
    { id: 'n1', skill: 'number', level: 'B1', point: 'ten', seg: [22.95, 30.75],
      stem: 'How many employees does a Parks Department in a town this size usually have?',
      choices: ['Seven', 'Ten', 'Eleven'], a: 1, keep: true,
      cue: '「traditionally has」のあと。',
      line: 'the Parks Department *traditionally has 10 employees*. You have only seven.',
      said: '「この規模の町なら公園課は10人が普通。君の所は7人だけだ」と言う。',
      mean: 'traditionally ＝ 昔から、ふつうは。比べる数とロンの数が並ぶ。',
      trap: 'すぐあとに only seven が来るので7を選びやすい。普通の人数とロンの人数は別。',
      use: 'How many people usually work here?（ここは普通何人で働いていますか）' },

    // R fix: V2 + K6 (blind 60 %): the key was the only hedged choice ("may") against a "must". All three say "likely".
    // why: let three go ← the 10-vs-7 gap heard as people let go; right size ← "a town of this size" heard as a
    //   compliment on running lean
    { id: 'i1', skill: 'infer', level: 'B2', point: 'seven', reveals: ['ten'], seg: [22.95, 30.75],
      stem: 'By comparing the two staff numbers, what is Chris hinting?',
      choices: ['Ron’s team is likely too small for the job', 'Ron has likely let three of his people go',
                'Ron’s team is likely the right size already'], a: 0,
      cue: '二つの数と、最後の短い質問。',
      line: 'traditionally has 10 employees. *You have only seven.* Why is that?',
      said: '普通は10人なのに7人だけなのはなぜか、とロンに聞く。',
      mean: 'only が「少なすぎる」という見方を示す。人手が足りないのでは、という問題提起。',
      trap: '数の差から「3人辞めた」と考えやすいが、そうは言っていない。only は不足のしるし。',
      use: 'We only have two staff today.（今日は2人しかいないんです）' },

    // R fix: V2 (blind 70 %) + N7: "fired three people" gave away n1 (10 − 7) and the distractors were weak.
    // why: praise ← Chris's cheerful tone and "the work of four people" heard as a compliment; Leslie leaving ← "if
    //   she wins… City Council" heard as the thing he wants to know
    { id: 'g1', skill: 'gist', level: 'B2', point: 'aim', seg: [22.95, 49],
      stem: 'What is Chris’s aim in questioning Ron about his staff?',
      choices: ['To make the case for hiring someone new', 'To praise Ron for running a lean team',
                'To find out whether Leslie is leaving Parks'], a: 0,
      cue: '人数の質問から、最後の「I’m going to」まで。',
      said: '普通の人数と比べ、レスリーの働きと選挙の話をして、副部長を雇うつもりだと告げる。',
      mean: '人数の質問は、新しく人を入れるための前置き。最後の一文が話の行き先。',
      trap: '人数の差やロンの好みに引っぱられやすい。質問が何に向かっているかを聞く。',
      use: 'I think we need to hire someone.（誰か雇う必要があると思う）' },

    // R fix: V2 (blind 65 %): only the key named a concrete aim. Parallel "Manner: what he's doing" choices.
    // why: jokingly ← the line sounds like a joke (no boss says this), so it reads as a way out; defensive ← "work
    //   hard" heard as making excuses for the team
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'ineffective', seg: [28.55, 35.45],
      stem: 'How does Ron answer Chris’s question about the low staff number?',
      choices: ['Proudly: a small, weak team is his aim', 'Jokingly: he’s brushing off the question',
                'Defensively: he’s covering for his staff'], a: 0,
      cue: '「I work hard to」のあとの目標。',
      line: 'I work hard to make sure my department is *as small and ineffective as possible*.',
      said: '「自分の課をできるだけ小さく、役に立たないものにするよう努力している」と答える。',
      mean: 'ふつうは隠す欠点を、本気の目標として誇る。政府嫌いのロンらしい答え。',
      trap: '冗談に聞こえるが、work hard to は本気の努力の形。言い訳でもごまかしでもない。',
      use: 'I work hard to keep things simple.（物事をシンプルに保つよう努めている）' },

    // R fix: V2 (blind 65 %): the key's "boasts about what most bosses hide" spelled out the joke. Shorter, parallel.
    // why: Chris ← an answer this odd sounds aimed at the asker; the staff ← "ineffective" heard as Ron insulting his
    //   team
    // anchor: 30.8–35.4 s "I work hard to make sure my department is…": the subject is "I" and the aim is his own;
    //   59.3–60.2 s "a government project, which is abhorrent to me" shows he means it
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'ineffective', seg: [28.55, 35.45],
      stem: 'In Ron’s answer about his department’s size, who is the joke on?',
      choices: ['Ron himself, proud of what bosses hide', 'Chris, for asking such a serious question',
                'Ron’s staff, for being so useless'], a: 0,
      cue: '文の主語と、何のために努力しているか。',
      line: '*I work hard* to make sure my department is as small and ineffective as possible.',
      said: '人が少ない理由を聞かれ、「小さく役立たずにするよう、私が努力している」と胸を張る。',
      mean: '主語は I で、目標も本人のもの。上司なら隠すはずの事を自慢する本人が笑われている。本人は真顔。',
      trap: 'ineffective を部下への悪口と取りやすい。主語を追えば、話しているのはロン自身の方針。',
      use: 'I try to do as little as possible.（なるべく何もしないようにしてる）' },

    // why: two/seven ← Ron has seven people; three ← near number before "four"
    { id: 'n2', skill: 'number', level: 'B1', point: 'four', seg: [35.45, 41.95],
      stem: 'Leslie does the work of how many people, according to Chris?',
      choices: ['Three', 'Four', 'Seven'], a: 1, keep: true,
      cue: '「single-handedly」のあと。',
      line: 'Leslie Knope *single-handedly does the work of four people*',
      said: '「レスリーは一人で4人分の仕事をしている」と言う。',
      mean: 'single-handedly ＝ たった一人で。課が小さい理由をレスリーの働きで説明する。',
      trap: '直前に課の人数7が出ているので混ざりやすい。of のあとの数を聞く。',
      use: 'She does the work of two people.（彼女は二人分働く）' },

    // R fix: V2 (blind 50 %): "Built it back up" and "Weighed it up" were weak. Now "put more into it" (back heard as
    //   giving back) and "mapped it out" (scale = 縮尺).
    // why: more ← "back" heard as giving time back to Parks; mapped out ← scale = 縮尺, a map's scale
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'scaled', seg: [35.45, 45.65],
      stem: 'What has Leslie already done with her time at Parks?',
      choices: ['Cut down on it', 'Put more into it', 'Mapped it out'], a: 0,
      cue: '「she’s already」のあとの2語の動詞。',
      line: 'and she’s already *scaled back* her time.',
      said: '「しかも彼女はもう、ここでの時間を減らしている」と付け足す。',
      mean: 'scale back ＝ 規模や量を減らす。選挙運動の分、公園課の仕事を減らしたということ。',
      trap: 'scale を「目もり」や「はかり」と取ると別の意味になる。back は「減らす」方向。',
      use: 'We scaled back our plans this year.（今年は計画を縮小した）' },

    // R fix: V2 (blind 55 %): "all of it at City Council" was the only other Council choice. Now a near miss (her
    //   campaign) for the second half.
    // why: campaign ← "if she wins" puts the campaign in mind; leave Parks ← "if she wins" heard as a goodbye
    { id: 'd1', skill: 'detail', level: 'B1', point: 'divide', seg: [41.95, 46.15],
      stem: 'If Leslie wins, what will happen to her time, as Chris says?',
      choices: ['She’ll split it between Parks and City Council', 'She’ll split it between Parks and her campaign',
                'She’ll leave Parks for a new job'], a: 0,
      cue: '「she’ll be」のあとの動詞と、その後ろ。',
      line: 'If she wins, she’ll be *dividing her time between Parks and City Council*.',
      said: '「当選したら、公園課と市議会で時間を分けることになる」と言う。',
      mean: 'divide A between B and C ＝ AをBとCに分ける。両方を続ける。',
      trap: 'if she wins から選挙運動を思い浮かべやすい。between の後を聞く。',
      use: 'I divide my time between work and family.（仕事と家族に時間を分けている）' },

    // R fix: V2 (blind 65 %): "Leslie" was a clip word only the key had. Choices rebalanced.
    // why: relaxed ← slack = ゆるい; slower workers ← "slack" heard as slacker (サボる人)
    { id: 'ph1', skill: 'phrase', level: 'C1', point: 'slack', seg: [41.95, 49],
      stem: 'What would the new deputy director be there to do?',
      choices: ['Do the work that isn’t getting done', 'Keep the slower workers in line',
                'Make the office a bit more relaxed'], a: 0,
      cue: '文の最後の「to pick up」のあと。',
      line: 'I’m going to have to hire a deputy director to *pick up the slack*.',
      said: '「穴を埋めるために副部長を雇わないといけない」と言う。',
      mean: 'pick up the slack ＝ 抜けた分の仕事を引き受ける。ここではレスリーの減った分。',
      trap: 'slack を「ゆるい」「サボる」と取ると別の話。pick up と組むと「穴埋め」。',
      use: 'Can you pick up the slack this week?（今週、穴埋めをお願いできる？）' },

    // R fix: V2 (blind 60 %): the key was the only choice not about Leslie. Two Chris moves, one Leslie now.
    // why: Leslie running ← "Leslie" is said in Ron's next line; asking ← Chris's first question was about the small
    //   staff
    { id: 'i2', skill: 'infer', level: 'B2', point: 'no', seg: [48.25, 56.3],
      stem: 'When Ron shouts “No!”, what is he objecting to?',
      choices: ['Chris hiring a deputy director', 'Chris asking why the staff is small', 'Leslie running for City Council'], a: 0,
      cue: '直前のクリスの一文と、that’s unnecessary。',
      line: '*No!* Chris, *that’s unnecessary*. The department is doing fine without Leslie.',
      said: '副部長を雇うと聞き「だめだ！必要ない。レスリー抜きでもうまくいってる」と返す。',
      mean: 'that ＝ 直前の「人を雇う」話。レスリーの選挙ではなく、人が増えることに反対している。',
      trap: 'Leslie が聞こえるので選挙の話に思える。that は直前の一文。',
      use: 'No, that’s really not necessary.（いや、本当に必要ないよ）' },

    // R fix: V2 (blind 50 %): "fear" read as the sitcom answer; now "dread", parallel with the others.
    // why: loyalty ← "without Leslie" heard as missing her; pride ← "doing fine" taken at face value
    // anchor: 60.4–64.1 s "or we bring a new person into the department, which repulses me to my core": a new person
    //   is what he can't stand
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'no', reveals: ['choice'], seg: [48.25, 64.3],
      stem: 'After Ron lays out his two options, how should we hear his “No!”?',
      choices: ['As dread of a new person in his department', 'As pride in how well his team is doing',
                'As loyalty: nobody could replace Leslie'], a: 0,
      cue: '「No!」と、あとの二つ目の選択肢を比べて。',
      line: '*No!* … or we *bring a new person into the department, which repulses me to my core*.',
      said: '副部長の話に「だめだ！」と叫び、あとで「新しい人を入れるのは心底ぞっとする」と話す。',
      mean: 'あとの本音が前の一言を書きかえる。「大丈夫」は自信でなく、人を入れないための理由。',
      trap: 'without Leslie や doing fine を、仲間思いや自信と取りやすい。後の本音で答え合わせ。',
      use: 'We’re fine, really. No need for help.（本当に大丈夫、手伝いはいらない）' },

    // why: one more person ← "a new person" is Ron's later worry; a week without Leslie ← "doing fine without
    //   Leslie" just before; a government project ← Ron repeats "complete a government project" after
    { id: 'd2', skill: 'detail', level: 'B1', point: 'project', seg: [49.5, 59.25],
      stem: 'What does Chris challenge Ron’s team to do?',
      choices: ['Finish one major project', 'Hire just one new person', 'Run things for a week alone'], a: 0,
      cue: '「Complete」のあと。',
      line: 'Complete *one major project*.',
      said: '「レスリー抜きで大丈夫」と言うロンに「大きな事業を一つやり遂げろ」と返す。',
      mean: 'major project ＝ 大きな事業。人を雇わないための条件。',
      trap: '直前の without Leslie から「抜きで一週間」と取りやすい。言われたのは事業。',
      use: 'Let’s finish one big task first.（まず大きな仕事を一つ片付けよう）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'prove', seg: [52.75, 56.3],
      stem: 'Type Chris’s reply: “___. Complete one major project.” (3 words)', answer: 'then prove it',
      cue: '「without Leslie」のすぐあと、短い3語。',
      line: '*Then prove it*. Complete…',
      said: '「じゃあ証明してみろ。大きな事業を一つやり遂げろ」。',
      mean: 'Then prove it ＝ それなら証明して。then は「それなら」で、時間の「それから」ではない。',
      trap: 'prove it が「プルーヴィッ」とつながり、t は消えやすい。',
      use: 'You think you can? Then prove it.（できると思う？じゃあ見せてよ）' },

    // R fix: V2 (blind 65 %) + N7: "which project first" was weak; the line quoted "complete a government project"
    //   (d2's key), now trimmed.
    // why: likes both ← the usual "hard choice" script (two good things); who to hire ← "a new person" heard as a
    //   choice between candidates
    { id: 'g2', skill: 'gist', level: 'B2', point: 'choice', reveals: ['no'], seg: [53.95, 79.3],
      stem: 'Why is the decision Chris leaves Ron with so hard for him?',
      choices: ['He finds both of his options awful', 'He likes both options, but can pick only one',
                'He can’t decide which person to hire'], a: 0,
      cue: '「Either」と「or」のあと、それぞれの感想。',
      line: 'Either we… *which is abhorrent to me*, or we bring a new person in… *which repulses me*',
      said: '政府の事業か、新しい人か。どちらも「ぞっとするほど嫌だ」と言う。',
      mean: 'abhorrent ＝ 大嫌い、repulse ＝ 嫌悪させる。どちらの道も受け入れがたい。',
      trap: 'Either… or を「どちらもいい」迷いと取りやすい。which の後が拒否。',
      use: 'Both options are terrible.（どちらの選択肢もひどい）' },

    // R fix: V2 (blind 60 %): the key was the longest and the only two-part choice. Three "He ends it by saying…".
    // why: regrets it ← a sad childhood story usually ends in regret; kept both ← "I couldn't choose, so I… both of
    //   them" with "slaughtered" missed
    { id: 'h2', skill: 'humor', level: 'C1', point: 'calves', seg: [64.3, 79.3],
      stem: 'Why does Ron’s story about his childhood choice get a laugh at the end?',
      choices: ['He ends it by saying how good they tasted', 'He ends it by saying he kept them both',
                'He ends it by saying he still regrets it'], a: 0,
      cue: '「I couldn’t choose」のあとと、最後の一言。',
      line: 'I couldn’t choose, so I *slaughtered both* of them. And they were *delicious*.',
      said: '子どもの頃、2頭のどちらかを選べと言われ、選べず両方…「おいしかった」と結ぶ。',
      mean: '悲しい話のはずが、選ばずに両方を選び、最後は味の感想。後悔のない一言が落ち。',
      trap: '子どもの頃の話は反省で終わるという型で聞くと外れる。both の前の動詞を聞く。',
      use: 'I couldn’t choose, so I got both.（選べなかったから両方買った）' },
  ]
};
