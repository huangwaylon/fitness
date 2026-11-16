// REVIEW 2026-11-16: pass 7, fix 14, drop 0, new 0; ear checks 1
// OPEN: t2, h1, s2 and i2 read at 50–55 % from the choices on the blind pass; kept, because each distractor is a real
//   misreading that the audio refutes (see REVIEW.md)
// “Janice Breaks Up with Ross | Friends” (the official Friends channel, Best of Season 5): Ross moans about a wrong
// coffee order and his bad luck; Janice recites the rest of his list for him, takes the floor and ends it because he
// whines too much; he checks the reason, and by the end he's relieved.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Janice (84.2 s); Ross only in
// whisper (45 s, captions "was"; 23 s whisper "Boss, we need to talk", captions "yeah of course we need to talk").
// Untested: 23–25 s (see above); 87–90 s "Oh. My. God." (a catchphrase, not asked); whisper repeats "I'm not going to
// be okay" over the music at 95–107 s (a hallucination, the captions have nothing).
// EAR CHECK: 72.6–85.7 s n2 — the stress in "…that I annoy you, Janice" falls on "you" (assumed; the captions spread the
//   words over 11 s, so the delivery is slow and word by word)
import type { Clip } from '../types.ts';

export const janicedump: Clip = {
  id: 'janicedump', video: 'm26EYdpoN34', title: 'Janice Breaks Up with Ross', dur: 107, wpm: 126, band: 'slow',
  tags: ['恋愛'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 — blind 50 % and right: "begging" was a filler; now "hurt, but hiding it" (the brave-face reading)
    // why: hurt but hiding it ← a short answer after a breakup heard as 強がり; one more blow ← the opening "can't anything go right" sets up the
    //   breakup as the next piece of bad luck
    { id: 'g2', skill: 'gist', level: 'C1', point: 'outcome', reveals: ['now'], seg: [0, 97],
      stem: 'By the end of the scene, how does Ross take the breakup?',
      choices: ['He ends up relieved now that it’s over', 'He ends up hurt, but hiding it well',
                'He ends up seeing it as one more bad break'], a: 0,
      cue: '最後の「大丈夫？」への短い返事。',
      said: '文句ばかりの Ross が、ふられる側になる。最後に「大丈夫？」と聞かれ「今はね」と答える。',
      mean: 'ふられたことで、むしろ楽になった。不運の続きに見えて、最後に逆転する。',
      trap: '冒頭の嘆きから、不運がまた一つ増えた話に見えやすい。最後の一言まで聞く。',
      use: 'Honestly, I feel better already.（正直、もう気が楽になった）' },

    // why: not hot ← cold coffee is the commonest café complaint; costs more ← the other usual complaint
    { id: 'd2', skill: 'detail', level: 'B1', point: 'order', seg: [0.8, 5.9],
      stem: 'What is wrong with Ross’s coffee, by his account?',
      choices: ['It isn’t the drink he ordered', 'It isn’t hot enough to drink', 'It costs more than he thought'], a: 0,
      cue: '「今度は何？」と聞かれた直後。',
      line: 'What is wrong now? — This *isn’t what I ordered*.',
      said: '「今度は何？」と聞かれ、「頼んだものと違う」と答えている。',
      mean: 'isn’t what I ordered ＝ 注文と違う。定番の苦情。',
      trap: '温度や値段もよくある苦情だが、ここで言うのは中身が違うということ。isn’t の t は弱いが n は残る。',
      use: 'Excuse me, this isn’t what I ordered.（すみません、注文と違います）' },

    // R fix: V2 — "amused" was easy to cut (blind 60 %); now "cross with himself", a misreading of "what I ordered"
    // why: waiter ← "isn't what I ordered" is the start of a complaint to staff; himself ← "I ordered" heard as his
    //   own mistake
    { id: 't1', skill: 'attitude', level: 'B1', point: 'right', reveals: ['order'], seg: [3.5, 10.3],
      stem: 'How does Ross sound about the wrong order?',
      choices: ['Sorry for himself, as if it were one more blow', 'Annoyed with the waiter who got the order wrong',
                'Cross with himself for ordering the wrong thing'], a: 0,
      cue: '注文の話のあと、my life で終わる一言。',
      line: 'This isn’t what I ordered. Man, *can’t anything go right in my life*?',
      said: '注文と違うと言い、「人生で何かひとつでもうまくいかないのか」と嘆く。',
      mean: 'コーヒー一杯を人生全体の不運につなげている。自分をかわいそうがる言い方。',
      trap: '店員への文句に聞こえやすいが、誰も責めていない。my life と話を広げたら、嘆きのサイン。',
      use: 'Why does this always happen to me?（なんでいつも私ばっかり）' },

    // R fix: V2 — "Can't everything" was ungrammatical, leaving two real options (blind 50 %); now "Can't one thing",
    //   an idiom just as natural, with "one thing" ≈ "anything"
    // why: Can anything ← the t of can't drops before a vowel; Can't one thing ← "any-thing" and "one thing" blur when fast;
    //   Couldn't anything ← the n't is heard but the vowel isn't
    { id: 's1', skill: 'sound', level: 'B2', point: 'right', seg: [5.9, 10.3],
      stem: 'Fill the gap: “___ go right in my life?”',
      choices: ['Can’t anything', 'Can anything', 'Can’t one thing', 'Couldn’t anything'], a: 0,
      cue: 'Man のすぐあと、文頭の2語。',
      line: 'Man, *can’t anything* go right in my life?',
      said: '「何かひとつでもうまくいかないのか」。can’t の t は消え、anything につながる。',
      mean: '否定の疑問 Can’t…? で、いら立ちを表す。',
      trap: 't が消えても can’t は母音が長く強い。肯定の Can なら軽く短い。',
      use: 'Can’t anyone help me with this?（誰か手伝ってくれないの？）' },

    // R fix: V2 — "first" made the biggest trouble the obvious pick (blind 50 %); "losing his job" became the ex-wife's
    //   remarriage (also about marriage, said later in the list); it shows d1's key, so it reveals 'exwife'
    // why: apartment ← "falls apart" and "apartment" sound alike, and it comes next; ex-wife ← "marriage" is heard,
    //   and her wedding is in the same list
    { id: 'd3', skill: 'detail', level: 'B1', point: 'first', reveals: ['exwife'], seg: [10.0, 13.9],
      stem: 'What does Ross name as the first of his troubles?',
      choices: ['His marriage ending', 'Losing his apartment', 'His ex-wife remarrying'], a: 0,
      cue: '「First」で始まる一言。',
      line: '*First, my marriage falls apart*, and then I—',
      said: '「まず結婚がだめになって、それから…」と言いかける。',
      mean: 'falls apart ＝ 壊れる。Ross が自分で挙げる最初の不運。',
      trap: 'falls apart と apartment は音が似る。部屋や元妻の話は Janice が続けたもの。',
      use: 'The plan just fell apart.（計画がだめになった）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'lose', seg: [13.6, 18.95],
      stem: 'Type the next item: “…lose your apartment, and then ___.” (4 words)', answer: 'you lose your job',
      cue: 'apartment のあと、もう一度 and then。',
      line: 'and then *you lose your job*',
      said: '「それから仕事も失って」と付け足す。',
      mean: 'you lose your がつながり、your はほぼ「ヤ」。2回目なので速い。',
      trap: 'your を落として lose job と書きやすい。弱くても your は消えない。',
      use: 'Don’t lose your ticket.（チケットをなくさないでね）' },

    // R fix: V2 — "reciting them for him" was the only specific choice (blind 60 %); now three parallel "…, listing…"
    // R fix: C10 — ear check removed: the switch from "I" to "you" settles the speaker in both sources (addendum)
    // why: Ross ← the same list of his troubles goes on, so it sounds like him; her own ← "you lose your apartment"
    //   heard as a generic "you", as if she has had the same troubles
    { id: 'w1', skill: 'who', level: 'B2', point: 'list', seg: [13.6, 23.3],
      stem: 'Right after “I know, I know”, who goes on with the list?',
      choices: ['Janice, listing his troubles for him', 'Ross, listing his troubles himself',
                'Janice, listing troubles of her own'], a: 0,
      cue: '続きの文の主語が I か you か。',
      line: 'I know, I know. And then *you* lose your apartment…',
      said: '「分かってる、分かってる」のあと、you を主語に続ける。',
      mean: 'you で語るので話し手は Janice。彼の愚痴を本人に読み上げている。',
      trap: '同じ愚痴が続くので Ross に聞こえやすい。主語が I から you に変わる点で判断。',
      use: 'I know, I know. You told me.（分かってるって、聞いたよ）' },

    // R fix: V2 — "to blame" was a filler (blind 65 %); now "wants the whole story", the reading of a friend's
    //   "I know" as an invitation to go on
    // why: same troubles ← "you lose your apartment" heard as a generic "you" (it happens to people); whole story ←
    //   "I know, I know" heard as sympathy that invites him to go on
    { id: 'i1', skill: 'infer', level: 'C1', point: 'list', seg: [13.6, 23.3],
      stem: 'When Ross starts listing his troubles, what does Janice’s reply suggest?',
      choices: ['She has heard him go through them many times', 'She has been through the same troubles herself',
                'She wants him to tell her the whole story'], a: 0,
      cue: '「I know」を2回言ってから続ける部分。',
      line: '*I know, I know.* … and *now the coffee*, ah!',
      said: '「分かってる」と2回言い、彼の不運を先回りして並べる。',
      mean: '何度も聞かされて覚えてしまった、ということ。同情ではなく、うんざりしている。',
      trap: 'you を「一般の人」と取ると、自分も同じ目にあったと聞こえる。ここの you は Ross のこと。',
      use: 'I know, I know. Same story every time.（はいはい、いつもの話ね）' },

    // R fix: V2 (C2) — blind 55 %: "easy to fix" was off the scale the key sets up; now the comfort reading uses the
    //   same small-vs-big contrast, wrong only in direction (near miss, native-level §3.2)
    // why: comfort ← reciting someone's troubles can sound like sympathy, and the coffee is small next to the rest;
    //   agree ← the sincerity flip: the list taken as her real view of his luck
    // anchor: 14.1–22.3 s she says "I know, I know", recites his list for him in the "you" form, tops it with "now the
    //   coffee" and a mock "ah!"; 24–26.5 s "we need to talk" follows, so it isn't sympathy
    // retired: with n2 out, one C2 alone is under 2; back with n2 after its ear check
    { id: 'n1', skill: 'humor', level: 'C2', point: 'list', seg: [13.6, 26.8], retired: true,
      stem: 'Why does Janice end Ross’s list with the coffee?',
      choices: ['To mock him: a wrong order counted like a divorce', 'To comfort him: the coffee is small next to the rest',
                'To agree: the coffee really is one more bad break'], a: 0,
      cue: '大きな不運のあとに来る、最後の一つ。',
      line: '*I know, I know.* … and *now the coffee*, ah!',
      said: '彼の大きな不運を並べたあと、「そして今度はコーヒー、ああ！」とわざと大げさに締める。',
      mean: '注文違いのコーヒーを離婚や失業と並べて、彼の嘆き方をからかっている。このあと別れ話が始まる。',
      trap: '本人に代わって愚痴を言うのは同情ではない。大小の差がある物を並べたら、からかいを疑う。',
      use: 'Rain, traffic, and now my coffee spilled.（雨に渋滞、そのうえコーヒーまでこぼれた）' },

    // why: moved away ← "married" and "moved" start alike; lost her job ← "lose your job" comes just before
    { id: 'd1', skill: 'detail', level: 'B1', point: 'exwife', seg: [13.6, 23.3],
      stem: 'In the list of troubles, what happened with Ross’s ex-wife?',
      choices: ['She remarried very quickly', 'She moved away very quickly', 'She lost her job very quickly'], a: 0,
      cue: 'job のすぐあと、ex-wife に続く部分。',
      line: 'and then your *ex-wife gets married so fast*',
      said: '「それから元奥さんがすぐ結婚して」と続ける。',
      mean: 'gets married so fast ＝ すぐに再婚した。',
      trap: '直前の job が残り、元妻が仕事を失ったと取りやすい。gets married を聞き分ける。',
      use: 'They got married so fast!（あっという間に結婚したね）' },

    // R fix: V2 — the key was the only choice with "talk", the clip's word (blind 50 %); a distractor now has it too
    // why: refuses ← "No, no, no" heard as "I won't discuss feelings"; disputes ← "No" heard as an answer to "I feel…"
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'talk', seg: [23.5, 34.0],
      stem: 'When Ross starts “Sometimes I feel…”, what does Janice’s reply do?',
      choices: ['She cuts in so she can do the talking', 'She doesn’t want to talk about feelings',
                'She disputes the feeling he has just named'], a: 0,
      cue: 'No が続いたあとの短い一文。',
      line: 'Sometimes I feel… — No, no, no… *I’m going to talk.*',
      said: '彼が「時々思うんだ…」と話し始めると、「だめだめ、私が話すの」とさえぎる。',
      mean: '話す番を取り戻している。「話がある」と言ったのは彼女のほう。',
      trap: 'No を「話したくない」や「その気持ちは違う」と取りやすいが、彼はまだ何も言い終えていない。',
      use: 'Hold on, let me finish.（待って、最後まで言わせて）' },

    // R fix: V2 — the title makes "over" the default, and "beach trip" was a filler (blind 60 %); all three are now
    //   "Their best time together…", so the choice turns on "has set"
    // why: still to come ← "day in the sun" is a bright phrase, and the set/rise verb is easy to miss; too short ← a
    //   breakup line heard as a regret about length
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'sun', seg: [34.1, 44.9],
      stem: 'What does Janice mean by her line about the sun?',
      choices: ['Their best time together is over', 'Their best time together is still to come',
                'Their best time together was too short'], a: 0,
      cue: 'set（沈む）と、day in the sun の組み合わせ。',
      line: 'I believe that *the sun has set on our day in the sun*.',
      said: '「私たちの輝く日々に日が沈んだ」と詩のように言う。',
      mean: 'day in the sun ＝ 良い時期。それが終わった、という遠回しな別れ。',
      trap: 'day in the sun の明るい響きに引かれやすい。動詞 has set（沈んだ）で決まる。',
      use: 'Every team has its day in the sun.（どのチームにも輝く時がある）' },

    // R fix: V2/K6 — "that she means" made the key the only nuanced choice (blind 60 %); trimmed
    // why: small ← praise first can sound like "it's nothing serious"; hers ← the "it's not you, it's me" breakup
    //   script, which this scene breaks (it's his whining)
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'sweet', seg: [44.6, 58.6],
      stem: 'Why does Janice praise Ross just before “Unfortunately…”?',
      choices: ['To soften the complaint she is about to make', 'To hint that the problem is small and fixable',
                'To suggest that the problem is hers, not his'], a: 0,
      cue: 'ほめ言葉と、そのあとの内容の差。',
      line: 'You’re a very *sweet person*… *Unfortunately*, I just don’t think…',
      said: '「とても優しい人ね」とほめてから、「でも、あいにく」と本題に入る。',
      mean: 'ほめ言葉は、本気の苦情をやわらげる前置き。このあと彼の欠点をはっきり言う。',
      trap: '別れ話の定番「あなたじゃなく私の問題」を思い出しやすいが、ここで責めているのは彼のほう。',
      use: 'You’re great, but this isn’t working.（あなたは素敵だけど、うまくいかない）' },

    // R fix: V2 — blind 85 %: the opening moan made "complaining" the only fit; the distractors are now about his
    //   talk and his luck too (the ex-wife in his list, the bad luck itself)
    // why: ex-wife ← she's in the list, and "not over his ex" is the usual reason; bad luck ← the list of troubles
    //   heard as the reason itself
    { id: 'g1', skill: 'gist', level: 'B1', point: 'reason', reveals: ['whiny', 'second'], seg: [44.6, 71.2],
      stem: 'What reason does Janice give for ending things?',
      choices: ['She can’t stand his complaining any more', 'He talks about his ex-wife too much',
                'She thinks his bad luck will rub off'], a: 0,
      cue: 'unfortunately のあと、何に耐えられないか。',
      line: 'You’re ending this with me because *I’m too whiny*?',
      said: '「もう一秒もあなたの愚痴に耐えられない」と言い、彼も「愚痴っぽいから？」と聞き返す。',
      mean: '別れの理由は彼の不運ではなく、不運を嘆き続ける態度そのもの。',
      trap: '元妻や不運の話は彼の愚痴の中身。聞こえた語でなく、彼女が何に疲れたかを聞く。',
      use: 'I can’t deal with the complaining.（文句ばっかりはもう無理）' },

    // why: could ← weak "can" (kn) sounds short and past; didn't think ← the t of don't and the vowel blur;
    //   I'll ← "I can" with a weak k heard as a dark l
    { id: 's2', skill: 'sound', level: 'B2', point: 'second', seg: [50.6, 57.6],
      stem: 'Fill the gap: “Unfortunately, I just ___ take another second…”',
      choices: ['don’t think I can', 'don’t think I could', 'didn’t think I could', 'don’t think I’ll'], a: 0,
      cue: 'just のあと、take の前の弱い語。',
      line: 'I just *don’t think I can* take another second…',
      said: '「もう一秒も耐えられないと思う」。can は弱く「クン」に近い。',
      mean: '今の気持ちなので現在形。強調しない can は短く弱い。',
      trap: '弱い can は could や I’ll に聞こえやすい。didn’t なら過去の話。',
      use: 'I don’t think I can make it tonight.（今夜は行けそうにない）' },

    // R fix: V2 — blind 60 %: "no time today" was easy to cut; now "only a second more", the literal "take another
    //   second" with the negation missed
    // why: a second to think ← "second" as time; a second more ← "take another second" heard without "don't think I can"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'second', reveals: ['reason'], seg: [50.6, 58.8],
      stem: 'After “Unfortunately”, what does Janice say about his whining?',
      choices: ['She can’t put up with any more of it', 'She needs a second to think it over',
                'She can bear it for only a second more'], a: 0,
      cue: '「I just don’t think」のあとの動詞。',
      line: 'I just don’t think I can *take another second* of you whining.',
      said: '「もう一秒だって、あなたの愚痴に耐えられない」と言う。',
      mean: 'can’t take ＝ 我慢できない。another second は「あと一秒も」という強調。',
      trap: 'second を時間、take を「取る」と文字通りに取りやすい。',
      use: 'I can’t take this heat anymore.（この暑さにはもう耐えられない）' },

    // R fix: V2/K6 — "in disbelief" made the key the only nuanced choice, and gave i2's angle (blind 55 %); plain now
    // why: couldn't hear ← "hearing" taken as the ears; agreeing ← the "I hear you" preface read as agreement
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'hearing', seg: [59.2, 71.0],
      stem: 'When Ross first answers her reason, what is his opening line doing?',
      choices: ['Checking that he understood her right', 'Saying he couldn’t hear her clearly',
                'Agreeing with her before he argues back'], a: 0,
      cue: '答えの最初の一文。そのあと何を問い返すか。',
      line: '*Let me make sure I’m hearing this right.*',
      said: '「ちょっと確認させて。聞き違いじゃないよね」と前置きする。',
      mean: '聞こえなかったのではなく、信じられずに確かめている。',
      trap: 'hearing を「耳で聞く」、前置きを同意と取りやすい。make sure は確認。',
      use: 'Wait, let me get this straight.（待って、整理させて）' },

    // why: being dumped ← the script: the dumped one is shocked it's over; sweet person ← the last praise he heard
    { id: 'i2', skill: 'infer', level: 'B2', point: 'whiny', reveals: ['reason'], seg: [59.2, 71.0],
      stem: 'What part of Janice’s news does Ross seem to find hard to believe?',
      choices: ['The reason she gives for ending it', 'That she is the one ending it',
                'That she calls him a sweet person'], a: 0,
      cue: 'because のあとに、何をくり返すか。',
      line: 'You’re ending this with me *because I’m too whiny*?',
      said: '「愚痴っぽすぎるから、別れるってこと？」と聞き返す。',
      mean: '別れることより、その理由に驚いている。because 以下を問い返しているのがその証拠。',
      trap: 'ふられた側は別れ自体に驚くもの、という型で選びやすい。聞き返された部分に注目する。',
      use: 'You’re leaving because of that?（そんな理由で辞めるの？）' },

    // why: on "annoy" ← plain disbelief that he annoys anyone, the stress learners expect on the verb; on "whiny" ←
    //   the sincerity flip: "I've become" stressed as if he accepts he has changed
    // anchor: 73.1–84.2 s the restatement is spread word by word over 11 s and ends on her name ("you, Janice"): the
    //   contrast is with her; 86 s her "Well, yeah!" answers only the literal question
    // R fix: N7 — the stem, line, said and a choice showed "so whiny" (g1's and i2's key); listing those reveals left
    //   the C2 undrawable on play 4, so the quote is trimmed and the "whiny" choice became "become" (admitting a change)
    // retired: a C2 stress item, until its ear check (the stress on “you”, 72.6–85.7 s)
    { id: 'n2', skill: 'sound', level: 'C2', point: 'annoy', seg: [72.6, 85.7], retired: true,
      stem: 'Where is the stress in “…that I annoy you, Janice”, and why?',
      choices: ['On “you”: she, of all people, finds him annoying', 'On “annoy”: he can’t believe he annoys anyone',
                'On “become”: he admits that he has changed'], a: 0,
      cue: '一語ずつ区切る言い方で、いちばん強い語。',
      line: 'So you’re saying… that I annoy *you*, Janice.',
      said: '「つまり、僕が君をイライラさせてるってこと？」と、一語ずつ区切って言う。',
      mean: 'you が強いと「よりによって君が」という対比。君こそ人をイライラさせる、と言外に言う。',
      trap: 'annoy を強めると単なる驚き、become なら変化を認めたことになる。強勢は、何と比べているかを示す。',
      use: 'You think I’m late? You?（僕が遅刻？君が言う？）' },

    // why: gently ← a breakup answer "should" spare feelings (the Japanese frame); unsure ← "Well" heard as a pause
    //   to think
    { id: 't2', skill: 'attitude', level: 'B2', point: 'yeah', seg: [72.6, 87.6],
      stem: 'When Ross asks if he annoys her, how does Janice answer?',
      choices: ['Bluntly, as if the answer were obvious', 'Gently, trying to spare his feelings',
                'Unsure, as if she hadn’t thought of it'], a: 0,
      cue: '彼の問いのすぐあと、短い2語。',
      line: '*Well, yeah!*',
      said: '「まあ、そうね！」と、すぐに明るく認める。',
      mean: 'well はためらいではなく「言うまでもなく」の調子。気を使わずにはっきり肯定している。',
      trap: 'well を言いよどみと取ると、迷っているように聞こえる。直後の yeah の強さで判断する。',
      use: 'Well, yeah! Obviously.（そりゃそうでしょ）' },

    // why: brave face ← a short "I am" after a breakup heard as 強がり; cheered ← her question heard as care that
    //   moves him
    { id: 'h1', skill: 'humor', level: 'C1', point: 'now', seg: [92.0, 96.4],
      stem: 'When Ross is asked if he’ll be okay, why is his answer funny?',
      choices: ['He is glad to be free of her', 'He is putting on a brave face', 'He is cheered that she still cares'],
      a: 0,
      cue: '答えの最後の一語。',
      line: 'Are you gonna be okay? — *I am now.*',
      said: '「大丈夫？」と聞かれ、「今はね」と答える。',
      mean: 'now ＝ 君と別れた今は。ふられたのに、ほっとしていると明かしてしまう。',
      trap: '強がりや、気づかいへの喜びに聞こえやすいが、now が「別れたから」を指す。短い答えは最後の語を聞く。',
      use: 'I feel better now that it’s over.（終わってほっとした）' },
  ]
};
