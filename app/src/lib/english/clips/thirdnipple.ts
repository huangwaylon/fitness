// REVIEW 2026-11-16: pass 4, fix 15, drop 1, new 1; ear checks 1 (3 items)
// OPEN: h1, p2, nt2 are re-estimated at ≈ 45–50 % blind; each key is still the most "sitcom-natural" reading. Ship, or
//   rewrite again?
// OPEN: 8.3–10.9 s (underwear from sex with "Fun Bobby") stays untested, but d3 and nt1 play it; fine for the
//   learners, or cut those segments to start after it?
// “Chandler Has a Third Nipple | Friends” (the official Friends channel, Best of Season 2): a friend's secret comes out
// ("Who told you?"); she threatens the one who let it slip and pays him back by naming his own secret, a third
// nipple; everyone wants a look, and Joey finds out what the "nubbin" he'd been told about really was.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 63.7 s; whisper's lines after that are
// a loop. The sources differ at 3.5 s ("Um", whisper only), 11.2 s and 30.1 s ("What?", whisper only), 12.5 s
// ("Bitty, bitty, who told you?" / "WHO TOLD YOU?"), 24.7 s ("Not at all" / "at all") and 57.9 s ("what do you
// think" / "what did you think"); no key rests on those words, and the lines trim them. Untested: what the underwear
// story is about (8.3–10.9 s), "You bitch" (36.7 s) and the overlapping "Whip it out" chant (41.4–43.0 s). Speakers
// are named only where the audio or the title names them ("Joey", Chandler as the one with the nipple).
// EAR CHECK: 0.3 s s1, 21.0 s x1, 48.0 s x2 — the weak forms "have I not" (have ≈ ァヴ, not on its own), "didn't
//   know it was" (t lost, linked) and "as opposed to" (weak as, d‿t linked); both sources agree on the words
import type { Clip } from '../types.ts';

export const thirdNipple: Clip = {
  id: 'thirdnipple', video: 'Dgq35HFOvAU', title: 'Chandler Has a Third Nipple', dur: 75, wpm: 201, band: 'fast',
  tags: ['友だち', '家'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: K5/§9.5: "What did I not told you?" isn’t English; "had I not" (the weak have heard as had) replaces it
    // why: haven’t I ← the usual contraction, the form grammar expects; had I not ← the weak "have" (≈ əv) heard as
    //   had, a tense slip
    { id: 's1', skill: 'sound', level: 'B2', point: 'havei', seg: [0, 3.4],
      stem: 'Fill the gap: “What ___ told you?”',
      choices: ['have I not', 'haven’t I', 'had I not'], a: 0,
      cue: '文の最初、What のすぐあとの3語。',
      line: 'What *have I not* told you?',
      said: '「話してないことなんてある？」と聞き返す。',
      mean: 'haven’t I を分けた形で、not を立てて「何も隠してない」と強める。have は弱く「ァヴ」。',
      trap: 'いつもの短縮形 haven’t I に直して聞きやすい。not が独立して聞こえたら分けた形。',
      use: 'What have I not tried?（試してないことなんてある？）' },

    // R fix: V2 (blind 60 %, right): the two stock distractors left revenge as the only real motive; two motives the
    //   words nearly support replace them
    // why: own up ← "Who told you?" + "dead meat" heard as a hunt for the leaker, but he has already owned up (20.9 s)
    //   before the nipple comes up; no big deal ← "it’s not big… the same lines as" taken literally
    { id: 'g1', skill: 'gist', level: 'B2', point: 'revenge', reveals: ['notbig', 'example', 'admit'], seg: [0, 34.3],
      stem: 'Why does the third nipple come up at all?',
      choices: ['To pay back the one who spread a secret', 'To make him own up to spreading it',
                'To show her secret was no big deal either'], a: 0,
      cue: '責める一言のあとの流れと、例えの出し方。',
      said: '自分の秘密を広めた相手に強く言い返し、そのあと相手の秘密を皆の前で明かす。',
      mean: '秘密をばらされた仕返しに、相手の秘密をばらし返している。',
      trap: '「大したことない」「同じようなもの」を文字どおり取りやすい。誰の秘密を出したかで目的が分かる。',
      use: 'Okay, payback time.（よし、仕返しの時間だ）' },

    // R fix: V2 (blind 55 %, right): "what is it holding back?" presupposed a hidden thing that only the key named; the
    //   stem now asks what the opening signals, and the choices drop "she" (two women speak in 0–11 s)
    // why: nothing comes to mind ← "I don’t know" taken at face value (the literal hedge); facts not certain ← the hedge
    //   read as doubt about the charge (the Japanese 「〜かもしれないけど」 frame), but "the fact that" asserts it
    // anchor: 1.88–3.07 s "Oh, I don't know." is followed at once (3.66–10.73 s) by a long, exact charge, "How about the
    //   fact that the underwear … is yours…": the answer was ready before the shrug
    // retired: one C2 alone is under 2 (nt2 retired)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'opening', reveals: ['example'], seg: [0, 11.15], retired: true,
      stem: 'When the first reply starts “Oh, I don’t know”, what does that opening signal?',
      choices: ['That a pointed answer is ready', 'That nothing comes to mind yet',
                'That the facts aren’t quite certain'], a: 0,
      cue: '「I don’t know」の直後に何が続くか。',
      line: 'Oh, I don’t know. *How about the fact that* the underwear … is yours',
      said: '「さあ、どうかな」と言ってから、すぐに「あの下着、あなたのだよね」と細かく突きつける。',
      mean: '迷うふりは、用意した答えを効果的に出すための間。すぐ細かい中身が続くのが証拠。',
      trap: 'I don’t know を本当の迷いや「さあね」と取りやすい。直後に具体的な話が来たら、わざとの前置き。',
      use: 'Oh, I don’t know… how about my birthday?（さあね…私の誕生日とか？）' },

    // why: by the terrace ← "pole" heard, and "out on the terrace" comes a moment later, as where something else
    //   happened; streetlight ← another pole outside, if "telephone" is lost
    { id: 'd3', skill: 'detail', level: 'B1', point: 'pole', seg: [3.1, 11.15],
      stem: 'Where does the underwear turn out to be?',
      choices: ['On the telephone pole', 'On a pole by the terrace', 'On a streetlight outside'], a: 0,
      cue: '「out there」のあと、on で始まる場所。',
      line: 'the underwear *out there on the telephone pole* is yours',
      said: '「外の電柱にかかっている下着はあなたのものでしょう」と言う。',
      mean: 'out there は「あそこの、外の」。下着がずっと電柱に引っかかっていた、という話。',
      trap: 'あとに terrace も出るので場所を取り違えやすい。on のあとの名詞をそのまま拾う。',
      use: 'The keys are out there on the table.（鍵は向こうのテーブルの上だよ）' },

    // R fix: V2 (blind 65 %, right): "a joke, she’s playing along" was the weak one; a second "true" reading replaces it
    // why: false ← "Who told you that?" is also how people deny a rumor; doesn’t mind ← "Who told you?" heard as mild
    //   curiosity, before "You are dead meat" lands
    { id: 'i1', skill: 'infer', level: 'C1', point: 'admit', reveals: ['source', 'deadmeat'], seg: [11.8, 23.1],
      stem: 'What does “Who told you?” give away about the underwear story?',
      choices: ['It’s true, and someone let it slip', 'It’s false, and someone made it up',
                'It’s true, but she doesn’t really mind'], a: 0,
      cue: '問い返しのあと、誰かに向けた強い一言。',
      line: '*Who told you?* … You are dead meat.',
      said: '否定せずに「誰から聞いたの？」と聞き、そのあと話した相手を責める。',
      mean: '否定より先に出どころを聞くのは、本当だと認めたのと同じ。',
      trap: 'Who told you that? はうわさを否定するときにも使う。続く反応が怒りか笑いかで決める。',
      use: 'Okay, fine. Who spilled it?（分かったよ。誰がしゃべったの？）' },

    // R fix: V2 (blind 70 %, right): "how long they’ve known" was a filler; all three are now who-questions built on
    //   the words heard, and the choices drop "she"/"them" (two women in the turn)
    // why: else told ← "who" + "told" heard as who else knows; saw it ← "who" + the pole just mentioned, as if she
    //   wanted a witness
    { id: 'd4', skill: 'detail', level: 'B1', point: 'source', seg: [11.8, 15],
      stem: 'What does she want to know once the underwear story is out?',
      choices: ['Who passed the story on', 'Who else has been told', 'Who saw it up on the pole'], a: 0,
      cue: '話の直後、短い問い返し。',
      line: '*Who told you?*',
      said: '下着の話を持ち出され、すぐ「誰から聞いたの？」と返す。',
      mean: 'Who told you? ＝ 誰がしゃべったの？知りたいのは話の出どころ。',
      trap: 'who と told だけ拾うと「ほかに誰が知ってる？」に聞こえる。told you で「あなたに言った人」。',
      use: 'Wait, who told you that?（待って、それ誰から聞いたの？）' },

    // R fix: V2 (blind 50 %, right): "ought to be ashamed" was weak; a disappointment reading replaces it
    // why: dead to me ← "dead" heard in the set phrase for ending a friendship; let her down ← a short, harsh line
    //   heard as hurt disappointment rather than a threat of payback
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'deadmeat', seg: [18.2, 23.1],
      stem: 'What does the line right after “Who told you?” tell the person it’s aimed at?',
      choices: ['He’s in serious trouble with her', 'He’s no longer a friend of hers', 'He’s really let her down this time'],
      a: 0,
      cue: '「You are」のあとの2語の決まり文句。',
      line: 'You are *dead meat*.',
      said: '秘密を話した相手に向かって「あんた、ただじゃおかないから」と言う。',
      mean: 'dead meat ＝ ひどい目にあうぞ。友だち同士の冗談まじりの脅し。',
      trap: 'dead から「縁を切る」（dead to me）を連想しやすい。dead meat は罰の予告。',
      use: 'If Mom finds out, you’re dead meat.（ママにばれたら、ただじゃすまないよ）' },

    // why: one friend ← the usual "I only told one person" excuse; someone else ← passing the blame, a stock move
    //   when caught
    { id: 'd1', skill: 'detail', level: 'B1', point: 'excuse', seg: [18.2, 23.1],
      stem: 'How does he defend himself for spreading the story?',
      choices: ['He didn’t know it was a secret', 'He only told one friend, as a secret', 'He heard it from someone else'],
      a: 0,
      cue: '責められた直後、I で始まる返事。',
      line: 'I *didn’t know it was a big secret*.',
      said: '責められて「そんなに大きな秘密だとは知らなかった」と言い訳する。',
      mean: '話したことは認めつつ、秘密だと知らなかったと言って責任を軽くしている。',
      trap: '言い訳の型はいくつもあるので、聞く前に決めつけやすい。返事の最初の動詞を拾う。',
      use: 'Sorry, I didn’t know it was private.（ごめん、内緒だと知らなかった）' },

    // R fix: V2 (blind 55 %, right): sarcasm was the only non-literal reading; "jokingly" (right register, wrong
    //   feeling) replaces "modestly", and the segment now starts at "You are dead meat" so the anger is inside it
    // why: sincerely ← the Japanese 「大したことないよ」 said to forgive; jokingly ← the singsong "say, oh, I don’t know"
    //   heard as fun, but "dead meat" and the payback show she is angry
    { id: 't1', skill: 'attitude', level: 'C1', point: 'notbig', reveals: ['revenge'], seg: [18.2, 31.8],
      stem: 'When she answers “No, it’s not big…”, how is she speaking?',
      choices: ['Sarcastically: it matters a lot to her', 'Sincerely: she is letting him off lightly',
                'Jokingly: she finds the whole thing funny'], a: 0,
      cue: '返事のあと、すぐに続く「例え」の中身。',
      line: '*No, it’s not big* … at all. You know, kind of the same lines as…',
      said: '「ううん、全然大きくないよ」と言い、すぐに相手の秘密を例に出す。',
      mean: '言葉は許しの形だが、続く仕返しで皮肉だと分かる。本当は大問題だと言っている。',
      trap: '日本語の「大したことないよ」は許しの言葉なので、そのまま取りやすい。言葉のあとの行動で本音を測る。',
      use: 'Oh sure, no big deal at all.（ああ、全然たいしたことないよね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'excuse', seg: [20.36, 23.1],
      stem: 'Type his reply: “I ___ a big secret.” (4 words)', answer: "didn't know it was",
      cue: '「I」のあと、つながって速く流れる4語。',
      line: "I *didn't know it was* a big secret.",
      said: '「大きな秘密だとは知らなかった」と言う。',
      mean: 'didn’t の t はほぼ消え、know it was が「ノウイッワズ」とつながる。',
      trap: 'didn’t を do と聞くと「知っている」になる。n の音が残れば否定。was も弱く短い。',
      use: 'I didn’t know it was your seat.（あなたの席だと知らなかった）' },

    // R fix: V2 (blind 55 %, right): "tells him to speak up" was a filler; "Say," as a topic opener replaces it
    // why: reports ← "say" read as its usual verb (言う), as if quoting someone; new topic ← "Say, …" as the opener that
    //   turns a conversation, but here it sits mid-sentence after "as"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'say', seg: [25.55, 31.8],
      stem: 'Just before “oh, I don’t know”, what does her one-word aside do?',
      choices: ['It brings in an example', 'It reports someone’s words', 'It shifts to a new topic'], a: 0,
      cue: '「the same lines as」のすぐあとの一語。',
      line: 'kind of the same lines as, *say*, oh, I don’t know, having a third nipple.',
      said: '「同じようなものよ、たとえば…そうね、乳首が3つあるとか」と言う。',
      mean: 'この say は「たとえば」。例の前の短いつなぎで、口語的。',
      trap: 'say を「言う」と取ると、誰かの発言の引用に聞こえる。カンマで挟まれた say は「たとえば」。',
      use: 'Let’s meet, say, around seven?（そうだな、7時ごろに会う？）' },

    // R fix: V2 (blind 55 %, right): "Faking" was the only non-literal word; the key is reworded and the distractors
    //   brought level
    // why: really hunting ← "oh, I don’t know" taken as a real hesitation (the literal hedge); easing ← the Japanese
    //   「言いにくいけど」 frame, a pause read as reluctance
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'example', reveals: ['opening', 'say', 'revenge'],
      seg: [25.55, 31.8],
      stem: 'Right before “having a third nipple”, what is her little hesitation doing?',
      choices: ['Making a planned jab sound random', 'Really hunting for an example that fits',
                'Easing into news she feels bad sharing'], a: 0,
      cue: '迷う言葉と、そのあとの例えの近さ。',
      line: '…, say, *oh, I don’t know*, having a third nipple.',
      said: '例を探すように「えーと、そうね」と言ってから、相手の秘密をはっきり口にする。',
      mean: '迷うふりで、思いつきの例に見せている。実は狙いを定めた暴露。',
      trap: 'I don’t know を本当に迷っていると取りやすい。迷った直後に的確な例が出たら、演技の合図。',
      use: 'Someone, I don’t know, like you?（誰かさん、そうね、たとえばあなたとか？）' },

    // R fix: V2 (blind 60 %, right): "a promise to keep both secrets quiet" was a filler; the underwear secret coming
    //   back replaces it, and the key no longer says "word" (the item’s own point)
    // why: fight ← the scene opened on "Who told you?", so the blame seems to carry on; underwear ← the first secret
    //   still in the air, as if the teasing swung back to her
    { id: 'g2', skill: 'gist', level: 'B2', point: 'ending', reveals: ['word', 'nubbin'], seg: [31.75, 64.3],
      stem: 'Where does the scene end up after the reveal?',
      choices: ['In confusion over what he’d been told', 'In a fight over who spread it first',
                'In teasing about her underwear again'], a: 0,
      cue: '最後のやり取り、ある一語をめぐる話。',
      line: 'You told me it was a *nubbin*.',
      said: '皆が見たがったあと、Joey が「nubbin だと聞いていた」と言い出し、その語の意味で話がずれる。',
      mean: '秘密の仕返しから始まった場面が、言葉の勘違いの笑いで終わる。',
      trap: '前半の「誰がしゃべった」の流れが続くと思いやすい。最後の数行の話題を聞く。',
      use: 'Wait, what does that word mean?（待って、その言葉どういう意味？）' },

    // R fix: V2 (blind 50 %, right): "a small mark that’s fading" was a filler; a second "bump" reading replaces it
    // why: lump that hurts ← bump/lump near sound, and a lump is often a health worry; looks odd ← "bump" caught but
    //   "nothing to see" and "useless" missed
    { id: 'd2', skill: 'detail', level: 'B1', point: 'bump', seg: [43.05, 50.8],
      stem: 'When pushed to show it, how does he describe it?',
      choices: ['A tiny bump that does nothing', 'A tiny lump that sometimes hurts', 'A tiny bump that looks odd'],
      a: 0,
      cue: '「just a tiny」のあとの一語と、次の文。',
      line: 'It’s just a *tiny bump*. It’s *totally useless*.',
      said: '「ただの小さなでっぱりだよ。全く役に立たない」と言う。',
      mean: 'bump ＝ 小さなふくらみ。小ささと無意味さを並べて、大したことないと言っている。',
      trap: 'bump と lump は似た音。後ろの useless まで聞けば「痛む」ではないと分かる。',
      use: 'It’s just a tiny scratch.（ただのかすり傷だよ）' },

    // R fix: V2 (blind 50 %, right): the key named the intent outright; reworded to describe the move
    // why: removed ← "nothing to see" read literally, as if it were gone; daring ← "Come on" heard as 「さあ、どうぞ」,
    //   an invitation
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'nothing', seg: [43.05, 50.8],
      stem: 'When everyone wants a look, what is his first reply doing?',
      choices: ['Playing it down to avoid showing it', 'Saying it was removed long ago', 'Daring them to take a good look'],
      a: 0,
      cue: '「Come on」のあとの理由の言い方。',
      line: 'Come on. *There’s nothing to see.*',
      said: '見せろとはやされ、「やめてよ。見るものなんてないって」と返す。',
      mean: '見る価値はない、と言って見せずに済ませようとしている。',
      trap: '文字どおり「もうない」と取りやすいが、続く説明ではまだある。Come on はここでは「よしてよ」。',
      use: 'Come on, there’s nothing to see here.（ほら、見るものなんてないよ）' },

    // R fix: V2 (blind 55 %, right): the key was the only one with "either"; reworded, with the distractors brought level
    // why: more than three ← "other nipples", plural, heard as a count; praised ← "multi-functional" taken at face value
    //   (the sincerity flip)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'useless', reveals: ['bump', 'opposed'], seg: [43.05, 50.8],
      stem: 'Why does the reply about his “other” nipples get a laugh?',
      choices: ['His normal two are just as useless', 'He seems to have even more than three',
                'His normal ones get praised as special'], a: 0,
      cue: '言い訳の直後、as で始まる返し。',
      line: 'It’s totally useless. — Oh, *as opposed to* your other *multi-functional* nipples.',
      said: '「全く役に立たない」に、別の声が「ほかの多機能な乳首と違って？」と返す。',
      mean: 'ふつうの2つも役に立たない。「役立たず」を言い訳にしたのを笑っている。',
      trap: 'multi-functional を本気のほめ言葉と取りやすい。大げさな語が来たら皮肉を疑う。',
      use: 'Oh, and yours is so much better?（へえ、あなたのはそんなにいいの？）' },

    // R drop s2: V2 (blind 80 %) and §9.5: "as supposed to" / "as opposite to" aren't real English options (its own
    //   trap note said so). R new x2: the same chunk as a dict, where the weak "as" and linked d‿t are what's tested
    { id: 'x2', skill: 'dict', level: 'B2', point: 'opposed', seg: [47.47, 50.8],
      stem: 'Type the reply: “Oh, ___ your other…” (3 words)', answer: 'as opposed to',
      cue: '「Oh」のすぐあと、弱く速い3語。',
      line: 'Oh, *as opposed to* your other multi-functional nipples.',
      said: '「ほかの多機能な乳首とは違ってね」と返す。',
      mean: 'as opposed to ＝ 〜とは対照的に。as は弱く、opposed to の d と t がつながる。',
      trap: 'as が弱く消えやすく、d と t は一つの音になる。3語のかたまりで覚えておく。',
      use: 'I prefer tea, as opposed to coffee.（コーヒーよりお茶派です）' },

    // why: amazed ← "I can't believe" as 信じられない, a wow; doubtful ← the literal reading: he doesn't believe the news
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'believe', reveals: ['nubbin'], seg: [51.9, 56.4],
      stem: 'How does Joey feel when he speaks up about the “nubbin”?',
      choices: ['Annoyed that he’d been misled about it', 'Amazed that such a thing even exists',
                'Doubtful that the story is even true'], a: 0,
      cue: '次の文「You told me…」とのつながり。',
      line: '*I can’t believe you.* You told me it was a nubbin.',
      said: '「信じられない。nubbin だって言ったじゃないか」と責める。',
      mean: 'I can’t believe you ＝ ひどいよ。驚きではなく、相手への不満を表す。',
      trap: 'can’t believe を「すごい」や「疑う」と取りやすい。you で終われば非難。',
      use: 'I can’t believe you ate my cake!（私のケーキ食べたなんてひどい！）' },

    // R fix: V2 (blind 60 %, right) + S1: the stem’s “nubbin” told a blind reader he’d heard a word; the stem is now
    //   neutral and "pretending" is recast as keeping quiet
    // why: kept it quiet ← the follow-up question can sound like a check on a lie; only now ← "You have a third
    //   nipple?" (another voice) heard as Joey’s
    { id: 'i2', skill: 'infer', level: 'C1', point: 'nubbin', seg: [51.9, 64.3],
      stem: 'What had Joey already known about it?',
      choices: ['That it was there, but not what it was', 'That it was a nipple, but kept it quiet',
                'Nothing; he’s only now hearing of it'], a: 0,
      cue: '「You told me」と、相手の聞き返し。',
      line: 'You told me it was a *nubbin*. — Joey, what … you think *a nubbin* was?',
      said: '「nubbin だって言ってた」に、相手は「nubbin を何だと思ってたの？」と返す。',
      mean: '何かあるとは聞いていたが、乳首だとは知らなかった。',
      trap: '「乳首が3つ？」の驚きから、何も知らなかったと取りやすい。told me なら話は聞いていた。',
      use: 'You told me it was nothing!（何でもないって言ったじゃん！）' },

    // R fix: V2 (blind 50 %, right): "took the word as a joke" was weak; a "didn’t believe it" near miss replaces it
    // why: never saw it ← "you hear a word" heard as the whole story, the general "you" as people in general; didn’t
    //   believe ← "nubbin" sounds made-up, but "I thought that’s what it was" says he believed it
    // anchor: 61.51–62.78 s "You see something, you hear a word", then 62.84–63.63 s "I thought that's what it was";
    //   with 54.44–55.78 s "You told me it was a nubbin", the "you" is Joey himself: he saw it, heard the word, and
    //   took it as the thing's name
    // retired: for the draws (play 3+ under g2 drew no C2): g2 reveals its point
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'word', reveals: ['nubbin'], seg: [53.9, 64.3], retired: true,
      stem: 'Which plain-English version keeps what Joey means at the end?',
      choices: ['I saw it, and took your word as its name', 'I never saw it; I only heard the word',
                'I saw it, but didn’t believe your word'], a: 0,
      cue: '「You see」の you と「I thought」の I。',
      line: '*You see something, you hear a word.* I thought that’s what it was.',
      said: '「何か見て、言葉を聞いて、それがその名前だと思ったんだ」と説明する。',
      mean: 'you は一般論の形だが、中身は自分の体験。実物を見せられ、nubbin と言われ、それを名前だと信じた。',
      trap: '一般の you と取ると、実物を見ていないように聞こえる。体験を語る you は「自分は」と読む。',
      use: 'You see the price, you walk away.（値段を見たら、帰るよね）' },
  ]
};
