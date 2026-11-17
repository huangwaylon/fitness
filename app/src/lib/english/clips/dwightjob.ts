// REVIEW 2026-11-17: pass 2, fix 18, drop 0, new 0; ear checks 1
// REVIEW open: n1 — the blind read picked "3" at 50 % as the default number of résumé parts; kept (2/3/4 are the
//   real traps), but say if you want it rebuilt.
// “Dwight's New Job - The Office US” (the official The Office channel, BEST OF SEASON 3 - The Office US): one talking
// head. Dwight says he has left Dunder Mifflin and is on the job market, presents a three-part résumé, promises "three
// words" for himself and gives more, then admits the job he has taken is only for money "for the time being", and goes
// back to work: "Break's over."
// Segments from the captions, words from whisper (2026-11-16). Speech ends at 47 s; 47–72 s is silent, and whisper
// loops "It's fine for the time being" there. Only Dwight speaks. The two sources differ only on his last name at
// 17 s ("Schrute" / "Troop") and on "I'm officially" / "And I am officially" at 5.6 s; no key rests on either.
// The Office has no laugh track, so the humor items ask what makes a line funny, not why an audience laughs.
// Untested on purpose: "Jackhammer… Insatiable" as words (innuendo), and what the new job is (only seen).
// EAR CHECK: 35.6 s c1 — stress in “Everything is on my horizon” falls on “Everything” (assumed; both sources agree on the words)
import type { Clip } from '../types.ts';

export const dwightNewJob: Clip = {
  id: 'dwightjob', video: '73u88Fka8k4', title: 'Dwight\'s New Job  - The Office US', dur: 72, wpm: 150,
  band: 'mid', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 85 %: the title and Dwight's persona). Distractors now fit him: boasting about the new job (the
    //   title's "New Job"), and explaining a firing (show knowledge). Both are refuted by "I have left… record-breaking"
    //   and "fine for the time being".
    // why: boasting ← the title's "new job" plus his bragging tone; fired ← "I have left Dunder Mifflin" heard as the
    //   start of a firing story
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['market'], seg: [0, 47.5],
      stem: 'Overall, what is Dwight doing as he talks to the camera?',
      choices: ['Selling himself to future employers', 'Boasting about how great his new job is',
                'Explaining why he left his old company'], a: 0,
      cue: '前半の言い方：履歴書、自己紹介、強み。',
      said: '会社を辞めたと言い、3部構成の履歴書、自分を表す言葉、将来の話を順に語る。',
      mean: '面接で自分を売りこむような話し方。最後に、今の仕事はつなぎだと明かす。',
      trap: '題名の new job から「新しい仕事の自慢」と取りやすいが、その仕事は「今のところ」の扱い。',
      use: 'Let me tell you a little about myself.（自己紹介させてください）' },

    // why: long, hard ← "after many… years" heard without the adjective; too many to count ← "many" heard, "record-"
    //   missed
    { id: 'd4', skill: 'detail', level: 'B1', point: 'years', seg: [0.4, 5.3],
      stem: 'How does Dwight describe his years at his old company?',
      choices: ['As record-breaking years', 'As long, hard years', 'As too many years to count'], a: 0,
      cue: '「after many」のすぐあと、years の前の語。',
      line: 'I have left Dunder Mifflin after many *record-breaking* years',
      said: '「記録を破り続けた何年もの後で、会社を辞めた」と言う。',
      mean: 'record-breaking ＝ 記録を破るほどの。辞めた話を、自分の実績の話にしている。',
      trap: 'many years だけだと「長く大変だった」と想像しやすい。years の前の語を聞く。',
      use: 'It was a record-breaking year for us.（うちにとって記録ずくめの1年だった）' },

    // R fix: V2 (blind 70 %: the key was the only sensible career move). Distractors now fit Dwight: already in demand
    //   (his bragging), and selling at a market (the literal "market", and he is a salesman). Segment start 4.9 → 5.0.
    // why: in demand ← a Dwight-style boast read into "officially on the job market"; selling at a market ← "market"
    //   taken literally, and he sells for a living
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'market', seg: [5.0, 9.0],
      stem: 'Having left, what does Dwight say he now is?',
      choices: ['Open to offers from new employers', 'Already wanted by several companies',
                'Now selling goods at a market'], a: 0,
      cue: '「officially」のあと、market で終わる言い方。',
      line: 'officially *on the job market*',
      said: '「正式に、職探し中の身になった」と言う。',
      mean: 'on the job market ＝ 転職・就職の市場に出ている。雇ってくれる先を探している。',
      trap: 'market を「市場・売り場」と文字通りに取りやすい。自分が「売りに出ている」イメージ。',
      use: 'I’m back on the job market.（また仕事を探しています）' },

    // R fix: V2 (blind 75 %: "For your convenience" made the prepared, perfect form the natural pick). The gap is now
    //   before "into three parts", where all four tenses fit; it reveals 'parts'.
    // why: I broke ← the weak 've disappears, leaving a plain past; I'll break ← 've and 'll both shrink to a short
    //   sound; I'm breaking ← "broken" heard as an -ing form
    { id: 's1', skill: 'sound', level: 'B2', point: 'broken', reveals: ['parts'], seg: [8.4, 11.5],
      stem: 'Fill the gap: “___ into three parts.”',
      choices: ['I’ve broken it down', 'I broke it down', 'I’ll break it down', 'I’m breaking it down'], a: 0,
      cue: '「convenience」のすぐあと、I に付く小さな音。',
      line: 'For your convenience, *I’ve broken it down*…',
      said: '「分かりやすく分けておきました」。I’ve は短く弱い。',
      mean: 'broken it down はつながって一息。完了形で「準備済み」を示す。',
      trap: 'v がほぼ消えて I broke に聞こえやすい。broken の -en が完了形の目印。',
      use: 'I’ve broken it down by day.（日ごとに分けておいたよ）' },

    // R fix: V2 (blind 70 %: "business pitch" in the key named the phrase's register). The choices are now three plain
    //   functions; two are politeness frames a Japanese listener may read into it.
    // why: apology ← "convenience" heard as politeness about a long résumé (お手数ですが frame); read along ← "your
    //   convenience" heard as an instruction to follow his list
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'convenience', seg: [8.5, 12.0],
      stem: 'As Dwight starts on his résumé, what does his opening phrase do?',
      choices: ['It treats the viewer like a customer', 'It apologizes for taking the viewer’s time',
                'It asks the viewer to read along with him'], a: 0,
      cue: '履歴書の話に入る前の、決まり文句。',
      line: '*For your convenience*…',
      said: '「お客様の便宜のために」という決まり文句から、履歴書の説明に入る。',
      mean: '店や会社が客に使う言い方。自分を商品のように売りこむ、ビジネス調の前置き。',
      trap: '丁寧な言い方なので、日本語の「お手数ですが」のようなおわびに聞こえやすい。',
      use: 'For your convenience, I’ve made a list.（分かりやすいようにリストにしました）' },

    // why: four ← "three words" later, and the parts run on with "And"; two ← "Professional resume" and "Athletic…
    //   resume" are the two that end in "resume"
    { id: 'n1', skill: 'number', level: 'B1', point: 'parts', reveals: ['broken'], seg: [8.5, 18.0], keep: true,
      stem: 'How many parts does Dwight say his résumé has?',
      choices: ['2', '3', '4'], a: 1,
      cue: '「into」のすぐあとの数。',
      line: 'I’ve broken it down into *three parts*.',
      said: '「3つに分けた」と言い、そのあと3つの名前を順に挙げる。',
      mean: 'three parts ＝ 3部構成。仕事、運動と特技、自分についての豆知識。',
      trap: 'resume で終わるのは2つなので、2に引かれやすい。3つ目は And のあとに来る。',
      use: 'There are three parts to this.（これは3つに分かれています）' },

    // R fix: S4: the segment started on "Professional" (12.0); it now starts at 11.4.
    // why: sports and skills ← the second part, "Athletic and special skills", is the last one with "resume"; letters
    //   from bosses ← the usual third part of a job file (references)
    { id: 'd2', skill: 'detail', level: 'B1', point: 'trivia', seg: [11.4, 18.0],
      stem: 'What is the last part of what he has prepared?',
      choices: ['Facts and trivia about himself', 'A list of his sports and skills', 'Letters from his old bosses'],
      a: 0,
      cue: '最後の「And」のあと、自分の名前に続く語。',
      line: 'And *Dwight Schrute trivia*.',
      said: '仕事の履歴書、運動と特技の履歴書、そして「ドワイトに関する豆知識」。',
      mean: '自分についてのクイズのような知識まで、売りこみに入れている。',
      trap: '特技の履歴書を最後と取りやすいが、それは2番目。最後の And のあとを聞く。',
      use: 'Here’s some fun trivia about me.（私についてのちょっとした豆知識）' },

    // R fix: V2 (blind 80 %: only the key fit Dwight's bravado). Both distractors are bold now: calling his employers
    //   foolish (wrong target for "foolish"), and taking any job at all (the plain first half, twist missed). Segment
    //   end 22.2 → 22.0 (it cut "How").
    // why: employers foolish ← "foolish enough to face me" heard with the hirer as subject; any job ← "ready to face
    //   any challenges" heard alone, the twist missed
    { id: 'h1', skill: 'humor', level: 'C1', point: 'challenges', seg: [17.5, 22.0],
      stem: 'What makes his line about facing challenges funny?',
      choices: ['He talks as if challenges fear him', 'He calls anyone who hires him foolish',
                'He brags he will take on any job at all'], a: 0,
      cue: '文の後半、face の主語が入れかわるところ。',
      line: 'I am ready to face any challenges that might be *foolish enough to face me*.',
      said: '「自分に立ち向かうほど愚かな困難なら、受けて立つ」と言う。',
      mean: '困難を、自分におびえる相手のように扱っている。大げさな強がりがおかしい。',
      trap: 'foolish を雇う側のことと取りやすい。that の先は challenges で、愚かなのは困難。',
      use: 'Bring it on.（かかってこい）' },

    // R fix: V2 (blind 85 %: the stem restated the act, and the key spelled out "so he can answer it"). New stem asks
    //   why; short parallel purposes. Segment end 24.5 → 25.6, to take in "Hardworking", his own answer.
    // why: asks the crew ← a question to the camera heard as a real question to someone; buys time ← the pause after
    //   it heard as えーと, real searching
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'describe', reveals: ['words'], seg: [21.5, 25.6],
      stem: 'Why does Dwight ask how he would describe himself?',
      choices: ['To set up an answer he has ready', 'To ask the crew how they see him',
                'To buy time while he picks his words'], a: 0,
      cue: '質問のすぐあと、だれが答えるか。',
      line: '*How would I describe myself?* Three words.',
      said: '「自分をどう表すか？」と自分で問い、すぐ「3語で」と答え始める。',
      mean: '面接の定番の質問を自分で出して、自分で答える。準備してきた売りこみの型。',
      trap: '疑問文なので本当の質問や迷いに聞こえやすい。すぐ自分で答えたら、話を進めるための問い。',
      use: 'How would I put it? Honest, mostly.（どう言うかな…まあ正直者かな）' },

    // R fix: V2 (blind 85 %: the joke is known, and only the key was a joke). All three choices now read "promises
    //   three words, then…", so the count decides it. Line trimmed before "Jackhammer" (innuendo).
    // why: fewer ← the long gaps after "Hardworking. Alpha male." heard as the end; repeats ← "Alpha male" heard as a
    //   word said twice
    { id: 'h2', skill: 'humor', level: 'C1', point: 'words', seg: [21.5, 33.0],
      stem: 'What makes his answer about describing himself funny?',
      choices: ['He promises three words but gives more', 'He promises three words but gives fewer',
                'He promises three words but repeats one'], a: 0,
      cue: '最初に言った数と、実際に並べる数。',
      line: '*Three words.* Hardworking. Alpha male…',
      said: '「3語で言うと」と言ってから、5つの言葉を次々に並べる。',
      mean: '自分で決めた数をすぐ超える。数より勢いで話している、というおかしさ。',
      trap: '一語ずつ間があくので、途中で終わったように聞こえやすい。最初の数を覚えて、数えながら聞く。',
      use: 'In a word? Tired.（ひと言で言うと？疲れた）' },

    // R fix: V2 (blind 80 %: unsure and joking don't fit Dwight). Distractors are now tough stances he could take:
    //   defensive, and bitter toward his old boss. Both are refuted because no one doubts him; he is answering his
    //   own question about himself.
    // why: defensive ← tough words heard as a reply to someone's doubts; bitter ← "merciless" heard as aimed at the
    //   company he just left
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'confident', seg: [22.0, 33.0],
      stem: 'As he lists the words for himself, how does Dwight come across?',
      choices: ['Proud, as if each word were a strength', 'Defensive, as if someone doubted him',
                'Bitter, as if hitting back at his old boss'],
      a: 0,
      cue: '並べる言葉が、ほめ言葉か弱点か。',
      line: 'Hardworking. *Alpha male.* … *Merciless.*',
      said: '「働き者、ボス的な男、容赦ない」と、強さを表す言葉だけを並べる。',
      mean: 'どれも本人には長所。迷いなく自分を売りこんでいる。',
      trap: '強い語が続くので反論や当てつけに聞こえやすいが、相手はいない。自分の問いへの答え。',
      use: 'I’m confident I can do this.（これはやれる自信がある）' },

    // R fix: S2 + V2 (blind 70 %): the stem quoted "Break's over", the words that answer it. The stem now points at
    //   "his final words"; the distractors are near misses (rehearsing for an interview; boasting about the new job).
    // why: rehearsal ← "employment search" just before, and the résumé framing; boasting about the job ← the bragging
    //   tone carried over to "this job"
    // anchor: 23–47.5 s the claims ("Alpha male… Everything is on my horizon") against "I got this job to make some
    //   money… fine for the time being. Oops. Break's over.": the whole talk was given on a work break
    { id: 'c2', skill: 'infer', level: 'C2', point: 'break', reveals: ['search', 'fine'], seg: [23.0, 47.5],
      stem: 'After his final words, how should we hear his earlier big talk?',
      choices: ['As big talk from a man on his work break', 'As a speech he is rehearsing for an interview',
                'As boasting about the new job he just got'], a: 0,
      cue: '最後の一言から、彼が今どこにいるか。',
      line: 'it’s fine for the time being. Oops. *Break’s over.*',
      said: '強気の自己紹介のあと、「今のところはいい」と言い、「おっと、休憩終わり」と仕事に戻る。',
      mean: '最後の一言が全体を書きかえる。「すべてが地平線に」と語った人は、仕事の休憩中だった。',
      trap: 'employment search から面接の練習と取りやすい。最後の一言は、話していた場所を明かす。',
      use: 'For now, it pays the rent.（今のところは、家賃のため）', retired: true },

    // R fix: V2 (blind 85 %: the key was the only coherent arc). All three now begin "Big claims end with…": a job that
    //   will do, regret at leaving (the "uh…" pause), a job he loves ("fine" heard as praise).
    // why: regret ← the hesitant "And, uh…" before "fine" heard as second thoughts; loves it ← "fine" heard as plain
    //   approval, "for the time being" missed
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['search', 'fine'], seg: [32.5, 47.5],
      stem: 'How does the end of his talk compare with the start?',
      choices: ['Big claims end with a job that will do for now', 'Big claims end with regret at having left at all',
                'Big claims end with a job he says he loves'], a: 0,
      cue: '大きな話のあと、今の仕事をどう言うか。',
      said: '「すべてが地平線に」と言ったあと、今の仕事は「お金のため、今のところは」と言う。',
      mean: '強気の売りこみが、地味なつなぎの仕事の話で終わる。その落差が見どころ。',
      trap: '「えー」の間を後悔と、fine を「気に入った」と取りやすい。期限の語を聞く。',
      use: 'It’s just a temporary thing.（一時的なものだよ）' },

    // R fix: V2 (blind 70 %: only the key was grand). "Travel" is now "one big offer is about to come", a grand
    //   reading of "everything on my horizon" that "except everything" refutes.
    // why: no plans ← "nothing on my horizon" heard alone (keyword trap); one big offer ← "on my horizon" heard as one
    //   thing coming, "everything" taken as "something big"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'horizon', seg: [32.6, 37.6],
      stem: 'In his line about his horizon, what does Dwight mean?',
      choices: ['Any future at all is open to him', 'He has nothing planned just now', 'One big offer is about to come'],
      a: 0,
      cue: '「nothing」で始まった文の、最後の一語。',
      line: 'There’s nothing on my horizon *except everything*.',
      said: '「地平線には何もない、すべて以外は」と言い、言い直す。',
      mean: 'on the horizon ＝ これから来るもの。「何でもあり得る」をねじれた形で言う。',
      trap: 'nothing だけ聞くと「予定なし」と取りやすい。except のあとで意味がひっくり返る。',
      use: 'The sky’s the limit.（可能性は無限大）' },

    // R fix: V2 (blind 65 %: "second horizon line" hinted at a correction, and "my" was weak). The stem now quotes the
    //   line, as in native-level §2, and "my" is replaced by "is" (stressing "is" to insist), a near miss.
    // why: on "is" ← insisting "it IS so" is the other native way to answer a "nothing"; on "horizon" ← the noun is
    //   the content word, so it "should" carry the stress
    // anchor: 33.1–36.8 s "There's nothing on my horizon except everything." then "Everything is on my horizon.": the
    //   restatement moves "everything" to where "nothing" stood, so it carries the correction
    { id: 'c1', skill: 'sound', level: 'C2', point: 'horizon', seg: [32.6, 37.6],
      stem: 'In “Everything is on my horizon,” where is the stress, and why?',
      choices: ['On “everything”: undoing his first “nothing”', 'On “is”: insisting that it really is so',
                'On “horizon”: the far future, not the present'], a: 0,
      cue: '1回目の文の最初の語と、2回目の最初の語。',
      line: 'There’s nothing on my horizon except everything. *Everything* is on my horizon.',
      said: '「何もない、すべて以外は」のあと、「すべてが地平線に」と言い直す。',
      mean: '1回目は nothing で始まり否定に聞こえる。言い直しは everything を文頭に出し、強めて打ち消す。',
      trap: '名詞の horizon や念押しの is と思いやすい。言い直しは、前の文の直す所に強勢が来る。',
      use: 'Not some of it. All of it.（一部じゃなくて、全部）', retired: true },

    // R fix: S4: the segment ended at 40.1 s, inside "employment"; it now ends at 41.3 s, after "search".
    { id: 'x1', skill: 'dict', level: 'B2', point: 'search', reveals: ['fine'], seg: [37.5, 41.3],
      stem: 'Type what he says: “I got this job to ___ while I continue…” (3 words)', answer: 'make some money',
      cue: '「this job to」のすぐあと。some は弱く短い。',
      line: 'I got this job to *make some money* while I continue my employment search.',
      said: '「職探しを続ける間、お金をかせぐためにこの仕事に就いた」。',
      mean: 'make some money で、some は「スム」と弱く、前後とつながる。',
      trap: 'some が弱いので make money と書きやすい。小さい語も1語として書く。',
      use: 'I need to make some money.（少しお金をかせがないと）' },

    // R fix: V2 (blind 85 %; x1 shares the point, but the choices alone also gave it). The distractors now take a
    //   right half of the line each: "while he keeps looking" for a wrong purpose, and money for a wrong goal.
    // why: résumé ← "while I continue my employment search" heard right, and the purpose filled in from the résumé
    //   talk; business ← "make some money" heard, the goal filled in from his "alpha male" self-image
    { id: 'd3', skill: 'detail', level: 'B1', point: 'search', reveals: ['fine'], seg: [37.5, 41.3],
      stem: 'Why did Dwight take this job, by his own account?',
      choices: ['To earn some money while he keeps looking', 'To build his résumé while he keeps looking',
                'To save money for a business of his own'], a: 0,
      cue: '「I got this job」のあと、理由を言う部分。',
      line: 'I got this job to *make some money while I continue my employment search*.',
      said: '「職探しを続けながら、お金をかせぐため」と理由を言う。',
      mean: 'この仕事はゴールではなく、次の仕事が見つかるまでのつなぎ。',
      trap: '直前まで履歴書の話なので「経歴のため」と取りやすい。to のあとが目的、while は同時の話。',
      use: 'I took this job to pay the bills.（生活費のためにこの仕事を始めた）' },

    // R fix: V2 (blind 70 %: "for now" appeared only in the key). "Proud" is now "Grateful: glad of any work for now",
    //   so two choices are time-limited.
    // why: grateful ← "for the time being" heard as thankful for a stopgap; modest ← "fine" heard as 謙遜 (he likes it
    //   but plays it down), the Japanese frame
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'fine', reveals: ['search'], seg: [37.5, 45.0],
      stem: 'How does Dwight seem to feel about the new job itself?',
      choices: ['Lukewarm: it will do for now', 'Grateful: glad of any work for now', 'Modest: likes it, but plays it down'],
      a: 0,
      cue: '「And」のあとの間と、fine に付く言葉。',
      line: 'And, uh… it’s *fine for the time being*.',
      said: '少し言いよどんでから、「今のところは、まあいい」と言う。',
      mean: 'fine は「悪くない」程度。期限付きの言い方で、気持ちが入っていないと分かる。',
      trap: '控えめな言い方を日本語の謙遜や感謝と取りやすい。直前の「職探しを続ける」が本音を示す。',
      use: 'It’s fine for now, I guess.（まあ、今のところはいいかな）' },

    // R fix: V2 (blind 75 %: "his phrase about time" pointed at the idiom). The stem now asks how long the job is fine;
    //   the choices are three durations.
    // why: shift ← "time" heard as work hours (shift time); for good ← "fine" + "being" heard as a settled state
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'fine', seg: [41.5, 45.0],
      stem: 'After his pause, how long does he say the job is fine?',
      choices: ['Only until something better comes', 'Only until his shift ends today', 'For good, now he has settled in'],
      a: 0,
      cue: '「it’s fine」のあとの4語。',
      line: 'it’s fine *for the time being*.',
      said: '「今のところは、まあいい」と言う。',
      mean: 'for the time being ＝ とりあえず今は。いずれ変わる前提の言い方。',
      trap: 'time を勤務時間と取ると「シフトの間は」になる。being が付くと「当面」の決まり文句。',
      use: 'Let’s stay here for the time being.（とりあえずここにいよう）' },

    // R fix: V2 (blind 80 %, from c2's old stem and the odd-one-out choices) + S4 (it started inside "being" and ran 3.1 s;
    //   it now starts at 43.4, before "it's fine"). Two distractors now use "break" in the wrong relation.
    // why: between interviews ← "break" heard right, "employment search" fills in where; day off ← "break" heard as a
    //   holiday (休み)
    { id: 'i2', skill: 'infer', level: 'B2', point: 'break', seg: [43.4, 47.5],
      stem: 'What do his last words tell us about where he is?',
      choices: ['On a break at the job he just took', 'On a break between job interviews', 'At home, taking a day off work'],
      a: 0,
      cue: '最後の「Oops」のあとの2語。',
      line: 'Oops. *Break’s over.*',
      said: '「おっと、休憩終わり」と言って話を切り上げる。',
      mean: 'break ＝ 仕事の合間の休憩。新しい仕事の休憩中に話していたと分かる。',
      trap: 'break を「休暇」や面接の合間と取りやすい。over と組むと「休憩が終わった」で、仕事中。',
      use: 'Sorry, my break’s almost over.（ごめん、もうすぐ休憩終わり）' },
  ]
};
