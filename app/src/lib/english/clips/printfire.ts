// REVIEW 2026-11-16: pass 7, fix 19, drop 0, new 0; ear checks 1
// “Burning Printers - The Office US” (the official The Office channel, BEST OF SEASON 6 - The Office US): Andy reports a
// client's printer fire to Gabe; Darryl, still sore that Andy blamed the warehouse two years ago, feeds him a fake
// cover-up story, and when Andy films a printer test that seems to prove him right, Darryl is the one who gets scared.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Gabe (0.4 s), Darryl (63.5 s, his
// own talking head; 269.7 s "my partner Darryl Philbin"), Andy (53.4 s and on; "Andrew Baines Bernard" 230.5 s),
// Creed (129.7 s, as a job: whisper "Creed's head of quality assurance", captions "creates that of"), "Darnell"
// (137 s, both sources). The talking head at 134–147 s is never named, so stems call him "the coworker".
// Untested: 2.9–5.5 s and 15–18 s (almond butter / "apricot preserves": who asks, and the sources split: "I would
// even settle for" vs "how would he consent for"), 76–88 s (whisper "loose structure… freedom to improvise… like jazz",
// captions "freedom edgewise… like Janice"), 147–154 s ("I'm not down anymore… stand up for yourself": who and why
// isn't clear), 154–157 s (whisper "I got the text. It said 911", captions "next sit down in one thing"), 196–197 s
// (whisper "the fine print", captions "to find crane"), 245–255 s (whisper only: "Sabre Corporation may be overlooking
// certain safety regulations"; captions blank), 256 s ("It's smoking?" whisper, "[ __ ]" captions), 290 s on (music,
// whisper loops "I don't want to prank").
// NOTE: whisper repeats 101–127 s (a second copy of "How about Andy has a problem…" and "Creed's head…"); the captions'
// timings are used. "Andy has a problem" (whisper) vs "Andy is a problem" (captions): no line shows it.
// EAR CHECK: 164.3–168.3 s h2 — "Still no plan" is Darryl's (no name; assumed from "still" echoing his "I don't have
//   a plan, exactly" at 76 s). Also: is "It's bad… It's real bad" Darryl's too (Andy got his 911 text)? h2 no longer
//   depends on it.
import type { Clip } from '../types.ts';

export const printfire: Clip = {
  id: 'printfire', video: 'VUuTXRn8s7c', title: 'Burning Printers', dur: 311, wpm: 165, band: 'mid',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %, cold 55 %): the key was the only function; now three functions. Line trimmed to Andy's
    //   words ("Yeah, I don't know" is the other speaker).
    // why: look at the printer ← look = 見る, read literally; disagrees ← "Look, …" often opens push-back, and Gabe
    //   has just said "I don't know"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', seg: [5.2, 12.9],
      stem: 'Right before “one of my clients called”, what does the short word do?',
      choices: ['It pulls Gabe’s attention to his news', 'It asks Gabe to look at the printer',
                'It disagrees with what Gabe just said'], a: 0,
      cue: 'clients called の直前、文頭の短い一語。',
      line: '*Look*, one of my clients called.',
      said: '「ちょっと聞いて、客から電話があって」と本題に入る。',
      mean: '文頭の Look は「いいか、大事な話だ」と注意を引く合図。何かを見せるわけではない。',
      trap: '「見る」と訳すと物の話に、反論の Look と取ると口論になる。続くのが知らせなら、注意を引く合図。',
      use: 'Look, I’ll be honest with you.（あのね、正直に言うよ）' },

    // why: clearing a jam ← "paper tray" is said, and a jam is the usual tray trouble; ordering paper ← "clients
    //   called" heard as the client's reason for calling
    { id: 'd1', skill: 'detail', level: 'B1', point: 'job', seg: [5.2, 12.9],
      stem: 'What was the client doing when the printer trouble started?',
      choices: ['Running a big print job', 'Clearing a jam in the tray', 'Calling in to order paper'], a: 0,
      cue: 'he was のあと、何の途中だったか。',
      line: 'He was *in the middle of a big printing job*, and the back of the printer started smoking…',
      said: '「大きな印刷の途中で、プリンターから煙が出た」と客の話を伝える。',
      mean: 'in the middle of ＝ 〜の最中。何の時に起きたかを表す。',
      trap: 'paper tray や called が残ると、紙詰まりや注文の話を作りやすい。何の最中かを聞く。',
      use: 'Sorry, I’m in the middle of something.（ごめん、今ちょっと手が離せない）' },

    // R fix: V2 (blind 75 %, cold 60 %): two fillers. Now payback vs making peace (the old fight "at the time") vs a
    //   tip-off about Gabe ("hiding something" at face value).
    // why: making peace ← "I was mad as hell at the time… just be patient" heard as having cooled off; tipping off ←
    //   "You didn't feel like he was hiding something?" taken as a real warning
    { id: 'g1', skill: 'gist', level: 'B2', point: 'revenge', reveals: ['blame'], seg: [29.5, 118],
      stem: 'Across this part, what is Darryl doing to Andy?',
      choices: ['Getting back at him with a story he made up', 'Making peace with him after an old fight',
                'Tipping him off that Gabe is hiding a real problem'], a: 0,
      cue: 'カメラに向かって話す、2年前の話。',
      line: 'Andy blamed the warehouse… Just wait… *There’s gonna be an opportunity*.',
      said: 'Darryl はカメラに2年前の恨みを語る。そして Andy に怪しい話を吹き込む。',
      mean: '倉庫のせいにされた仕返しに、作り話で Andy を怖がらせている。',
      trap: '「当時は怒っていた」は今は許したとも聞こえる。待っていたのは仕返しの機会。',
      use: 'I’ll get you back for this.（この仕返しはするからね）' },

    // why: weeks / months ← "two" is caught and the unit after it is lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'when', reveals: ['getreal'], seg: [51.5, 60.4],
      stem: 'How long ago did the warehouse get blamed?',
      choices: ['Two weeks ago', 'Two months ago', 'Two years ago'], a: 2, keep: true,
      cue: '話のいちばん最初、数と単位。',
      line: '*Two years ago*, Andy blamed the warehouse…',
      said: '「2年前、Andy が遅れた出荷を倉庫のせいにした」と話し始める。',
      mean: 'ずっと前の恨み。長く根に持っていたことが、この仕返しの重さを表す。',
      trap: 'two だけ聞いて単位を落としやすい。数字のすぐあとの語を最後まで聞く。',
      use: 'We met two years ago.（2年前に会ったんだ）', retired: true },

    // R fix: K3: "Nobody's; it just got lost" was a filler; now the client, who ordered late (the late shipment read
    //   from the other end).
    // why: the warehouse ← "blamed the warehouse" is the first thing said; the client ← "late shipment" heard as an
    //   order placed too late
    { id: 'd2', skill: 'detail', level: 'B2', point: 'blame', seg: [51.5, 60.4],
      stem: 'Whose fault was the late shipment, according to Darryl?',
      choices: ['Andy’s, for forgetting to process it', 'The warehouse’s, for shipping it late',
                'The client’s, for ordering it too late'], a: 0,
      cue: 'shipment のあと、that で始まる説明。',
      line: 'Andy blamed the warehouse for a late shipment *that he forgot to process*.',
      said: '「Andy は自分が処理し忘れた出荷を、倉庫のせいにした」。',
      mean: 'blame A for B ＝ B を A のせいにする。本当は Andy の失敗。',
      trap: '最初に聞こえる warehouse を原因と取りやすい。that 以下の主語 he まで聞く。',
      use: 'Don’t blame me for your mistake.（自分のミスを人のせいにしないで）' },

    // R fix: V2 (blind 70 %, cold 55 %): "a better job" was a filler; now "his anger to pass" ("mad as hell at the
    //   time… be patient" read as calming down).
    // why: say sorry ← the frame 待てば相手が謝る; anger to pass ← "mad as hell at the time" + "just be patient" read
    //   as cooling off
    { id: 'i1', skill: 'infer', level: 'B2', point: 'revenge', seg: [62.45, 70.3],
      stem: 'When Darryl told himself to wait, what was he waiting for?',
      choices: ['Andy to slip up and give him a chance', 'Andy to see his mistake and say sorry',
                'His anger to pass so he could let it go'], a: 0,
      cue: 'he’s a fool のあと、来るはずのもの。',
      line: 'Just wait. *He’s a fool*. *There’s gonna be an opportunity*.',
      said: '当時「待て。あいつは間抜けだ。チャンスは来る」と自分に言い聞かせた。',
      mean: '間抜けならいつか隙を見せる、その時に仕返しする、という意味。',
      trap: '「待つ」を反省や怒りが収まるのを待つと取りやすい。fool と opportunity が並んだら、狙う側の話。',
      use: 'Just be patient. Your chance will come.（焦らないで。チャンスは来るよ）' },

    // R fix: K6: the key was the one that shared the most words with the others (a convergence cue); the choices
    //   now tie. The stem tells f1's key ("only ones heard clearly"), so it reveals makeout.
    // why: printer ← the day's topic; investigate ← official-sounding, and it shares eliminate's ending; Gabe ← his
    //   name is said a few seconds before
    { id: 'd3', skill: 'detail', level: 'B1', point: 'words', reveals: ['makeout'], seg: [99.8, 106.55],
      stem: 'Which words were the only ones heard clearly?',
      choices: ['Andy, problem, eliminate', 'Andy, printer, eliminate', 'Andy, printer, investigate',
                'Gabe, problem, investigate'], a: 0,
      cue: 'clearly was のあと、三つの単語。',
      line: 'Only thing I can make out clearly was *Andy, problem, eliminate* something.',
      said: '「はっきり聞こえたのは Andy、問題、消す、だけ」と、わざと断片だけ伝える。',
      mean: '文にならない三語だけ渡して、意味は相手に考えさせる。仕掛けの材料。',
      trap: '仕事の話だと思うと、printer などを予想で補いやすい。単語は音で拾う。',
      use: 'I only caught a few words.（少ししか聞き取れなかった）' },

    // R fix: V2 (blind 70 %, cold 85 %; 80 % on a re-read while the stem still said "mumbled"): the key was the only
    //   plain reading of "how well he heard". Now three claims about the three words; the stem no longer names the
    //   mumbling.
    // why: talking stopped ← "Only thing… was" heard as all there was to hear; a threat ← "eliminate" is among the
    //   words, so the phrase is read as "made sense of"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'makeout', seg: [99.8, 106.55],
      stem: 'How does he describe what he overheard?',
      choices: ['Only three words came through clearly', 'Three words, and then the talking stopped',
                'Only three words sounded like a threat'], a: 0,
      cue: 'mumbled のあと、can に続く句動詞。',
      line: 'It was kind of mumbled… Only thing I can *make out* clearly was…',
      said: '「もごもごしてた。はっきり聞き取れたのは…」と言う。',
      mean: 'make out ＝ 見えにくい、聞きにくいものを何とか聞き取る、見分ける。',
      trap: 'make out を「意味が分かる」と取ると脅しの話になる。音として聞こえたかどうかの句。',
      use: 'I can’t make out the sign from here.（ここからだと看板が読めない）' },

    // R fix: V2 (blind 75 %, cold 70 %): the printer reading was a filler. Now "a threat against Gabe" (right
    //   mechanism, wrong target: "him" heard as the man they suspect).
    // why: against Gabe ← Gabe is the one they think is hiding something, and "him" comes at the very end; laughs it
    //   off ← "What? You don't know what it meant?" heard as mocking disbelief
    { id: 'h1', skill: 'humor', level: 'C1', point: 'eliminate', reveals: ['words', 'getreal'], seg: [99.8, 111.4],
      stem: 'Why does the reply to “I don’t know what it meant” get a laugh?',
      choices: ['He turns the scraps into a threat against himself', 'He turns the scraps into a threat against Gabe',
                'He laughs the scraps off as harmless office talk'], a: 0,
      cue: 'How about のあと、三語をどうつなぐか。',
      line: 'You don’t know what it meant? How about… *we must eliminate him*?',
      said: '「分からない？『Andy が問題だ、消さなきゃ』だろ」と自分で文を作る。',
      mean: '伝えた側は何も言っていない。怖い筋書きを完成させたのは、狙われた本人。',
      trap: '疑っている Gabe が的に聞こえやすい。最後の him は Andy 自身。代名詞を追う。',
      use: 'Don’t jump to conclusions.（早まって決めつけないで）' },

    // anchor: 100.0–106.3 s three bare words, then "I don't know what it meant"; 106.6–110.8 s Andy builds the threat
    //   himself ("How about… we must eliminate him?"); the speaker set this up as payback (his talking head, 52–70 s)
    // R fix: V2 (blind 70 %, cold 50 %): "keeping the speakers' secret" was weak. Now "playing the words down so Andy
    //   won't panic" (the 気遣い frame); he brought the words to Andy unasked, so it fails.
    // why: misheard ← "kind of mumbled" taken as a real hedge (the literal hedge); playing down ← "I don't know" read
    //   as 気遣い, softening bad news
    { id: 'c1', skill: 'pragma', level: 'C2', point: 'eliminate', reveals: ['words'], seg: [99.8, 114.6],
      stem: 'When the speaker says he doesn’t know what the words meant, what is he doing?',
      choices: ['Leaving the scary meaning for Andy to build', 'Admitting he may have misheard the words',
                'Playing the words down so Andy won’t panic'], a: 0,
      cue: '分からないと言ったあと、誰が意味を作るか。',
      line: 'Andy, problem, eliminate something. *I don’t know what it meant.*',
      said: '三語だけ伝えて「意味は分からない」と言う。すると Andy が自分で「僕を消す気だ」と言い出す。',
      mean: '知らないふりは、相手に結論を言わせる仕掛け。自分で出した答えほど、人は強く信じる。',
      trap: 'mumbled を本当の言いわけ、「分からない」を気遣いと取りやすい。直後に相手が何をしたかを聞く。',
      use: 'I’m not saying anything. You decide.（僕は何も言ってないよ。君が決めて）' },

    // R fix: V2 (blind 60 %, cold 65 %): "worried" was weak. Now "in charge of this" (the keyword trap: head of
    //   quality assurance).
    // why: finished ← wrap up = 終える, a sense learners know well; in charge ← "head of quality assurance" just
    //   before makes him sound responsible for it
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'wrapped', seg: [129.2, 134.5],
      stem: 'After naming a coworker’s job, what does the speaker say about him?',
      choices: ['He must be involved in this', 'He must be finished with this', 'He must be in charge of this'], a: 0,
      cue: 'quality assurance のあと、so に続く部分。',
      line: '…quality assurance. So he’d definitely be *wrapped up in this*.',
      said: '「品質管理の責任者だから、絶対にからんでいる」と疑う。',
      mean: 'be wrapped up in ＝ 〜に深く関わっている。悪い事によく使う。',
      trap: 'wrap up ＝「終える」、役職から「担当」と取りやすい。in ＋ 悪い事なら「からむ」。',
      use: 'Don’t get wrapped up in this.（この件に関わらないで）' },

    // why: five ← "five bucks" is Gabe's reward later; thirty ← three and thirty sound alike to a quick ear
    { id: 'n2', skill: 'number', level: 'B1', point: 'bucks', seg: [134.6, 141.9],
      stem: 'How much is the coworker offered for his part?',
      choices: ['Three dollars', 'Five dollars', 'Thirty dollars'], a: 0, keep: true,
      cue: 'offers me のあと、お金の言い方。',
      line: 'Darnell offers me *three bucks*.',
      said: '「Darnell が3ドルくれると言った」と話す。',
      mean: 'bucks ＝ ドルのくだけた言い方。ほんの小銭で引き受けたことが、笑いの前ふり。',
      trap: 'three と thirty は似て聞こえる。thirty なら最後に「ティ」が付き、強さも前に来る。',
      use: 'It’s only five bucks.（たった5ドルだよ）' },

    // anchor: 143.4–146.6 s "I would've done it for anything. I've done a lot more for a lot less": every brag has "I"
    //   for its subject, and what it admits is that he'll do anything for almost nothing
    // why: Darnell ← "chump" names him, and he did overpay (right mechanism, wrong target); Andy ← he is the one being
    //   teased in the scene
    { id: 'c3', skill: 'humor', level: 'C2', point: 'chump', seg: [134.6, 147.1],
      stem: 'In this comment about Darnell, who is the joke really on?',
      choices: ['The speaker, though he means it as a dig', 'Darnell, for paying far too much for a small job',
                'Andy, for being the easy target of the prank'], a: 0,
      cue: 'chump のあと、I が主語の文の中身。',
      line: 'Darnell’s a chump… *I’ve done a lot more for a lot less*.',
      said: '「Darnell はカモ。もっと安く、もっとひどい事もしてきた」と得意げに言う。',
      mean: 'けなすつもりで、自分は小銭で何でもする人間だと明かしている。笑われているのは話し手。',
      trap: 'chump の相手だけ聞くと Darnell が的に見える。自慢の文の主語 I を追うと、恥はずっと本人のもの。',
      use: 'I’d do it for a sandwich.（サンドイッチ1個でやるよ）' },

    // R fix: V2 (blind 55 %, cold 55 %): two strong-feeling distractors against a mild key. Now "annoyed: could have
    //   asked for more" and "uneasy: too easy to be true", both from the deal's own words.
    // why: annoyed ← "chump" heard as anger, and three bucks is little; uneasy ← "All I gotta do is walk by Andy"
    //   sounds like money for nothing, which can feel suspicious
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'chump', seg: [136.4, 147.1],
      stem: 'How does the coworker feel about the deal he got?',
      choices: ['Pleased: he’d have done it for less', 'Annoyed: he could have asked for more',
                'Uneasy: it seemed too easy to be true'], a: 0,
      cue: 'chump のあと、I で始まる二つの文。',
      line: 'Darnell’s a *chump*. *I would’ve done it for anything*.',
      said: '「Darnell はカモだ。何でもやったのに」と言う。',
      mean: 'chump ＝ 損をする間抜け。払いすぎた相手を笑い、自分は得をしたと満足している。',
      trap: 'chump を怒りと取ると「もっと取れた」不満に聞こえる。誰が損をしたかを聞く。',
      use: 'I’d have done it for free.（タダでもやったのに）' },

    // why: saying sorry ← excuse = すみません, an apology frame; getting past ← "Excuse me" said to pass someone in a
    //   hallway
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'excuse', seg: [155.9, 160],
      stem: 'Just before “It’s bad”, what is the short request doing?',
      choices: ['Asking a coworker to leave them alone', 'Saying sorry to a coworker for interrupting',
                'Asking a coworker to let them get past'], a: 0,
      cue: '「It’s bad」の前、could you で始まる頼み。',
      line: 'Could you *excuse us*?',
      said: 'もう一人に「ちょっと外してくれる？」と頼み、二人きりになる。',
      mean: 'excuse us ＝ 席を外してほしい、という丁寧な頼み。内緒の話の前ぶれ。',
      trap: 'excuse を「すみません」と覚えていると謝罪に聞こえる。us が付いたら「二人にして」。',
      use: 'Could you excuse us for a minute?（少し外してもらえますか）' },

    // R fix: V2 (blind 60 %, cold 60 %) + N2: the notes said Andy says "It's real bad", but Andy is the one who got
    //   the 911 text, so it is likely Darryl's. The key and notes no longer depend on who says it; "still" ties the
    //   line to Darryl's "I don't have a plan, exactly" (76 s). Ear check kept for the speaker.
    // why: Andy ← the panic around the line ("Oh God, it's getting bigger") seems to be its speaker's; corporate ←
    //   "call HQ" earlier, and no fix has come
    { id: 'h2', skill: 'humor', level: 'C1', point: 'noplan', reveals: ['getreal'], seg: [163.8, 170.45],
      stem: 'Why does “Still no plan” get a laugh at this point?',
      choices: ['Darryl still hasn’t planned the prank he’s running', 'Andy still has no idea how to keep himself safe',
                'Corporate still has no fix for the faulty printers'], a: 0,
      cue: '「It’s real bad」のあと、別の声の短い一言。',
      line: 'It’s real bad. — *Still no plan.* — Oh God, it’s getting bigger.',
      said: '「本当にまずい」と深刻な中、「まだ何も考えてない」と一言。',
      mean: '計画なしの思いつきなのに、相手は勝手に怖がって話を大きくしていく。そのずれが笑い。',
      trap: '慌てた声の続きと聞きやすい。still は前の「計画はない」を受ける。声の変化を聞く。',
      use: 'I’m making it up as I go.（その場で考えながらやってる）' },

    // R fix: V2 (blind 65 %, cold 55 %): "recalled" was weak. Now "so Gabe has to take it to corporate" (the
    //   earlier "Call HQ").
    // why: sue ← "go public" heard as taking legal action; corporate ← Gabe said "Call HQ" earlier, so a fire would
    //   force his hand
    { id: 'd4', skill: 'detail', level: 'B1', point: 'proof', seg: [169.3, 177.3],
      stem: 'Why does Andy say he needs a printer to catch fire?',
      choices: ['So people will believe him', 'So he can sue the company', 'So Gabe has to tell corporate'], a: 0,
      cue: 'no one’s gonna のあと、続く二文。',
      line: 'no one’s gonna *believe me*. I *need proof*…',
      said: '「誰も信じてくれない。証拠がいる。プリンターが燃えるとか」と言う。',
      mean: '話を表に出すには証拠がいる、という理屈。燃えてほしいのは、信じてもらうため。',
      trap: 'Call HQ や go public から、本社や訴えの話にしやすい。need のあとを聞く。',
      use: 'Do you have any proof?（何か証拠はある？）' },

    // why: 4,000 / 40,000 ← "four hundred thousand" with "hundred" lost or heard as -ty; 4,000,000 ← big units mixed up
    //   when converting into 万
    { id: 'n3', skill: 'number', level: 'B2', point: 'reports', seg: [185, 191.3],
      stem: 'How many printers does Gabe set the reports against?',
      choices: ['4,000', '40,000', '400,000', '4,000,000'], a: 2, keep: true,
      cue: '12 のあと、続く大きな数。',
      line: 'there have been 12 reports of faulty printers… *400,000*.',
      said: '「欠陥の報告は12件。40万台のうちで」と言う。',
      mean: 'four hundred thousand ＝ 40万。英語は3けたで区切る。',
      trap: '「万」で数えると hundred thousand の変換で止まる。thousand の前の数を聞き、千倍する。',
      use: 'It’s one in a million.（めったにないことだよ）' },

    // R fix: V2 (blind 60 %, cold 50 %): the key was the only reassuring choice. "Worse than they thought" becomes
    //   "already been fixed", a reassuring reading the audio doesn't give ("investigated", not fixed).
    // why: spreading ← "12 reports" heard on its own, as a rising count; already fixed ← "We've investigated every
    //   time" heard as the matter being dealt with
    { id: 'i3', skill: 'infer', level: 'B2', point: 'reports', seg: [185, 195.95],
      stem: 'What is Gabe’s point in giving those two numbers?',
      choices: ['The problem is too rare to worry about', 'The problem is spreading fast in stores',
                'The problem has already been fixed'], a: 0,
      cue: '二つの数の差と、そのあとの説明。',
      line: '12 reports… *400,000*. … every time… *they block the vents* or something.',
      said: '「報告は40万台中12件。毎回使う側のせい」と言う。',
      mean: '数の差で「ごくまれ」と示し、原因も客に回す。会社として問題はない、という言い分。',
      trap: '12件だけ聞くと増加中、investigated を「対応済み」と取りやすい。二つの数の大きさを比べる。',
      use: 'It turns out it was my fault.（結局、私のせいだった）' },

    // R fix: V2 (blind 60 %, cold 50 %) + K6 ("openly" only in a distractor). Three parallel "He offers…" readings;
    //   "to keep Andy quiet" is the cover-up frame the scene is built on.
    // why: mocking ← a reward that small sounds like a joke (sincerity flip); keep quiet ← the whole scene is about a
    //   cover-up, so a reward reads as hush money
    { id: 'h3', skill: 'humor', level: 'C1', point: 'reward', seg: [196.9, 209],
      stem: 'What makes Gabe’s thank-you funny?',
      choices: ['He offers a tiny reward as if it were big', 'He offers a fake reward to make fun of Andy',
                'He offers a reward to keep Andy quiet'], a: 0,
      cue: 'reward のあと、ごほうびの中身と付け足し。',
      line: 'I’d like to *reward you*… That’s good for *five bucks at Dunkin’ Donuts*. *Any* Dunkin’ Donuts.',
      said: '「お礼に」とドーナツ店の5ドル券を渡し、「どの店でも」と付け足す。',
      mean: '本人は太っ腹のつもり。「どの店でも」と得意げに足すほど、小ささが目立つ。',
      trap: 'からかいや口止めと取りやすい。thank you と any の念押しは本気の口ぶり。',
      use: 'It’s a small thing, but thank you.（ささやかだけど、ありがとう）' },

    // R fix: V2 (blind 70 %, cold 55 %): "shows nothing, let down" was weak. Now "backs up Andy's fears, and Darryl
    //   is thrilled" (Andy's cheering carried over to his partner), so the second half has to be heard.
    // why: safe and relieved ← "no signs of distress" at 300 sheets, said early in the test; thrilled ← Andy cheers
    //   "blowing the roof off" and calls Darryl "my partner"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['quit'], seg: [219.5, 289],
      stem: 'How does the printer test end up, and how does Darryl take it?',
      choices: ['It backs up Andy’s fears, and Darryl gets scared', 'It backs up Andy’s fears, and Darryl is thrilled',
                'It shows the printers are safe, and Darryl is relieved'], a: 0,
      cue: '「I knew it」と、最後のカメラへの一言。',
      line: '*I knew it!* … I *don’t want to prank anymore*.',
      said: 'テストの途中で Andy が「やっぱり」と叫び、Darryl はカメラに「もういたずらはしない」と言う。',
      mean: '作り話の危険が本物らしくなり、仕掛けた側がおびえる。',
      trap: '「異常なし」や Andy の大喜びに引っぱられやすい。最後のカメラへの一言まで聞く。',
      use: 'I knew it! I told you so.（やっぱり！言ったでしょ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'watching', seg: [229.5, 232.55],
      stem: 'Type what Andy says after his name: “and ___, it’s because…” (4 words)',
      answer: "if you're watching this",
      cue: '自分の名前を言ったあと、and の次。',
      line: 'My name is Andrew Baines Bernard, and *if you’re watching this*…',
      said: '名前を言い、「これを見ているなら…」と録画を始める。',
      mean: '遺言ビデオの決まり文句。if you’re がつながり「イフヨー」と短く聞こえる。',
      trap: 'you’re は弱く、you や your と区別しにくい。短い音も一語として書く。',
      use: 'If you’re reading this, call me.（これを読んだら電話して）' },

    // R fix: K1: "Why is Andy told…" let the stated reason (the camera) stand as a second key. The stem now asks for
    //   the real reason.
    // why: clearer ← the reason given ("the camera makes you sound weird") taken at face value; hiding his voice ←
    //   "state's witness… in danger" just before suggests a disguised voice
    { id: 'i4', skill: 'infer', level: 'C1', point: 'voice', seg: [235.4, 244.4],
      stem: 'What is the real reason Andy is pushed to go higher and higher?',
      choices: ['To make him sound silly on his own tape', 'To make his voice sound clearer on camera',
                'To hide his voice, since he’s a witness'], a: 0,
      cue: '理由の説明と、何度もくり返す一語。',
      line: 'You should talk in a *higher voice* ’cause the camera makes you sound weird. … *Higher.*',
      said: '「カメラだと声が変に聞こえるから高い声で」と言い、何度も「もっと高く」と求める。',
      mean: '理由はでたらめ。真剣な告発ビデオを、間抜けな声で撮らせる仕返しの続き。',
      trap: 'カメラの理由をそのまま信じやすい。名前を名乗っているので、声を隠す意味もない。',
      use: 'Can you speak up a little?（もう少し大きな声で話してくれる？）' },

    // anchor: 257.9–264.3 s "I knew it! We are blowing the roof off!" (Andy cheering, unhurt, and at 268–273 s still
    //   calling Darryl "my partner"); 273.4–278.1 s "I don't want to prank anymore. Things get real. It's not funny."
    // R fix: V2 (blind 75 %, cold 75 %): "Andy has found out" is false by a plain fact (Andy calls him "my partner");
    //   now the nearer "Andy is close to finding him out". The key loses "as a joke", which only it had.
    // why: close to finding out ← "It's not funny" heard as fear of being caught (right target, wrong direction); went
    //   too far and Andy got hurt ← "It's not funny" heard as guilt over harm done
    { id: 'c2', skill: 'infer', level: 'C2', point: 'outcome', reveals: ['getreal', 'quit'], seg: [254.6, 278.6],
      stem: 'Given his comment to the camera, why does Darryl want to stop pranking?',
      choices: ['The threat he made up may be turning real', 'Andy is getting close to finding him out',
                'The prank went too far, and Andy got hurt'], a: 0,
      cue: '「I knew it」の喜び方と、そのあとの一言。',
      line: '*I knew it!* … This is my partner… *Things get real.* It’s not funny.',
      said: 'Andy は「やっぱり」と大喜び。Darryl はカメラに「本物になった。笑えない」と言う。',
      mean: 'カメラへの一言が場面を書きかえる。作り話が本当らしくなり、仕掛けた側がいちばん怖がっている。',
      trap: '「笑えない」を相手への反省と取りやすい。Andy は喜んでいるので、怖いのは話が本物になった事。',
      use: 'This just got real.（これはもう冗談じゃない）', retired: true },

    // R fix: V2 (blind 75 %, cold 75 %): "proud, planning a bigger prank" was a filler. Now "bored: pranks aren't fun
    //   anymore" (the literal 面白くない reading of "It's not funny").
    // why: bored ← "It's not funny" read literally as 面白くない; relieved ← "I'm just gonna be good" heard as calm
    //   closure
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'quit', seg: [273, 285.38],
      stem: 'In his last comment to the camera, how does Darryl feel?',
      choices: ['Shaken, and done with pranks', 'Bored: pranks aren’t fun anymore', 'Relieved, and glad it’s all over'], a: 0,
      cue: '最初の一言と、そのあとに並べる予定。',
      line: 'I *don’t want to prank anymore*. … I’m just gonna *be good*.',
      said: '「もういたずらはしない。いい子にする。教会に行く」と並べる。',
      mean: 'おびえて「もうやめる」と宣言している。並べる予定は子どもじみている。',
      trap: 'not funny を「面白くない」と取ると飽きた話になる。things get real が怖さを示す。',
      use: 'I’m done with this. I mean it.（もうやめる。本気だよ）' },

    // R fix: V2 (blind: got 60 % wrong, cold: get 65 %): "can get" was a filler beside the get/got pair. Now
    //   "are getting" (another natural "things … real"). Ear check dropped: both sources have "get".
    // why: got ← grammar expects the past for what just happened ("things just got real"), and /ɛ/–/ɑ/ is hard to
    //   tell apart; are getting ← the weak "are" is easy to imagine before a verb
    { id: 's1', skill: 'sound', level: 'B2', point: 'getreal', seg: [275.1, 278.6],
      stem: 'Fill the gap: “Things ___ real. It’s not funny.”',
      choices: ['get', 'got', 'are getting'], a: 0,
      cue: 'Things のすぐあと、短い一語の母音。',
      line: '*Things get real.* It’s not funny.',
      said: '「本当にやばくなる。笑えない」と言う。',
      mean: 'get real ＝ 冗談で済まなくなる。起きたばかりの事でも、今の実感として現在形で言っている。',
      trap: '文法では got を予想しやすい。get は「ゲ」、got は口を大きく開けた「ガ」に近い。',
      use: 'When kids get sick, things get real.（子どもが病気になると一気に大変になる）' },
  ]
};
