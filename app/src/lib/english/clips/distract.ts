// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 1
// Open: a second blind read still lands on g1, i1, p3, h2, h4 and d6 at 60–75 %, mostly through other items' stems
//   ("slow down", "made-up word"), which reveals now keep out of one draw; accepted after one rewrite each.
// “April Sees Through Leslie and Ron's Distraction | Parks and Recreation” (the official Parks and Recreation
// channel, Season 5): April insists on a dirty lot for her dog park; Leslie asks Ron, with a made-up employee called
// Ricky, how he used to slow her down, learns his "distraction waffles" trick, and takes April to a performance-art
// show, where April sees through it and reveals a councilman's backing.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–9 s (speakers of the opening praise
// unclear), 17–31 s (a heroin joke; captions “dog here” vs whisper “doll here”), 36–46 s (April's list of demands
// includes a sexual one), 51–62 s (who Leslie talks to: captions “Joe”, whisper “Jill”), 105–110 s (“mulch ado about
// nothing” needs the Shakespeare title), 138–168 s (the show's lines; speakers unclear), 209–241 s (moo/sheep tag).
// EAR CHECK: 182.7–186.6 s h7 — assumes April asks “What's your favorite part?” and Leslie answers “The
//   heavy-handedness” (the key holds either way: whoever claims to love the show names a flaw)
import type { Clip } from '../types.ts';

export const distract: Clip = {
  id: 'distract', video: 'f5qd1phdJ9I', title: 'April Sees Through Leslie and Ron\'s Distraction', dur: 241, wpm: 169,
  band: 'fast', tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2: g2’s old “cleaner lot” choice gave it away, and “far”/“kids’ park” were easy to drop; two choices now keep “zoned” or “industrial”.
    // why: homes ← "zoned" heard but the use missed; next to ← "industrial" heard in the wrong relation, as a neighbor
    { id: 'd1', skill: 'detail', level: 'B2', point: 'zoned', seg: [11.4, 17.25],
      stem: 'What problem with the land does someone point out?',
      choices: ['It is zoned as an industrial cleanup site', 'It is zoned for new homes, not for parks', 'It is next to an old industrial site'], a: 0,
      cue: 'zoned のあと、そして何を着るべきか。',
      line: 'it’s *zoned* 14B *industrial* … *cleanup site*. We should technically be wearing *hazmat suits*…',
      said: '「ここは工場のごみ処理地に指定。本当は防護服を着るべき」と言う。',
      mean: 'zoned ＝ 土地の使い道が決められている。汚れた土地で公園に向かない。',
      trap: 'industrial だけ拾うと「近くに工場」と取りやすい。it’s zoned の主語はこの土地。',
      use: 'This area is zoned for homes.（この地域は住宅用に指定されている）' },

    // why: 14 ← "14B" heard a moment earlier, about the zoning; 40 / 84 ← forty-eight heard without its end, or turned
    { id: 'n1', skill: 'number', level: 'B1', point: 'lot48', seg: [31.2, 36.2], keep: true,
      stem: 'Which lot does April say is the only one that works?',
      choices: ['Lot 14', 'Lot 40', 'Lot 48', 'Lot 84'], a: 2,
      cue: 'I’m sorry, but のあと、Lot に続く数。',
      line: 'Well, I’m sorry, but *Lot 48* is the only one that works.',
      said: '「悪いけど、使えるのは48番の土地だけ」と言い、議会で出すと話す。',
      mean: 'forty-eight。I’m sorry, but は謝りではなく、反対を押し切る前置き。',
      trap: '少し前の「14B」が耳に残りやすい。数は直前の名詞（Lot）とセットで聞く。',
      use: 'Our flight leaves from Gate 48.（私たちの便は48番ゲートから）' },

    // R fix: V2: the distractors were weak next to the key; all three now name who made April this way and what must happen.
    // why: help ← "destroy" softened by the Japanese frame of 後輩を助ける; Ron ← "created" heard without its subject, and she goes to Ron next
    { id: 'i1', skill: 'infer', level: 'B2', point: 'monster', seg: [46.4, 51.2],
      stem: 'In Leslie’s comment to the camera, what does she feel about April?',
      choices: ['She made April like this, and must stop her', 'April has gone too far, and she must help her', 'April learned this from Ron, who must stop her'], a: 0,
      cue: 'created の主語と、そのあとの need to。',
      line: '*I have created a monster*, and now I need to destroy her.',
      said: '「私が怪物を作った。今度は倒さなきゃ」と話す。',
      mean: 'create a monster ＝ 育てた相手が手に負えなくなる。自分のせいだと思っている。',
      trap: 'monster だけだと「April がやりすぎ」で止まる。created の主語は Leslie。',
      use: 'I’ve created a monster.（とんでもないものを育てちゃった）' },

    // R fix: V2: “forgot” and “thanks back” were easy to drop; all three are now “He says he … agreed”.
    // why: short ← her "I don’t have time" heard as his condition; insisted ← "walked in here and started talking" heard as pressure he gave in to
    { id: 'h2', skill: 'humor', level: 'B2', point: 'didnt', seg: [63.0, 67.6],
      stem: 'Why does Ron’s first reply to Leslie get a laugh?',
      choices: ['He says he never agreed to see her at all', 'He says he only agreed to a short meeting', 'He says he agreed only because she insisted'], a: 0,
      cue: 'お礼のすぐあと、とても短い一言。',
      line: 'Ron, thank you for agreeing to see me. — *I didn’t*. You just walked in here and started talking.',
      said: '「会ってくれてありがとう」に、Ron は「会うとは言ってない。勝手に来た」と返す。',
      mean: '形だけのお礼を、正面から打ち消している。そっけなさが笑い。',
      trap: 'お礼には「どういたしまして」の型を期待しやすい。I didn’t は agreeing の否定。',
      use: 'Thanks for waiting. — I didn’t.（待っててくれてありがとう。—待ってないよ）' },

    // R fix: V2: the town choice had no basis in the clip; both distractors are now Ron readings.
    // why: long stories ← Ron as the talker, though his lines are two short ones; long ago ← "history" read literally, as an old event
    // anchor: 65.6–67.4 s Ron's whole "history" is two short lines (“I didn't. You just walked in here and started
    //   talking.”); 67.6 s Leslie calls that a "history lesson"
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'history', seg: [63.0, 68.9],
      stem: 'When Leslie refuses a “history lesson”, who is the joke on?',
      choices: ['Leslie, calling two short lines a lecture', 'Ron, whose stories about the past run long', 'Ron, for dragging up a meeting from long ago'], a: 0,
      cue: 'Ron の返事の長さと、そのあとの呼び方の差。',
      line: '*I didn’t*. You just walked in here and started talking. — I don’t have time for *a history lesson*.',
      said: 'Ron は短い2文で「会うと言ってない」と言っただけ。Leslie はそれを「歴史の授業」と呼ぶ。',
      mean: '2文を「長い授業」と呼ぶ大げささが笑い。急いでいて聞かないのは Leslie の方。',
      trap: 'Ron の返事は短いので、長話の人という読みは合わない。言われた量と呼び方の差を聞く。',
      use: 'Spare me the speech.（演説はけっこう）' },

    // R fix: V2/§9.4: the title says “distraction”, and meters/vote were easy to drop; all three are now “A way to … someone”.
    // why: win over ← "a real thorn about it" heard as the real problem; slacking ← "used to be a slacker" heard as now
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['meish'], seg: [63.0, 136.2],
      stem: 'What does Leslie really want from her visit to Ron?',
      choices: ['A way to slow down someone who is too eager', 'A way to win over someone who opposes her plan', 'A way to stop someone from slacking off at work'], a: 0,
      cue: 'Here’s my question のあとの問い。',
      said: 'メーターの話から入るが、本題は「張り切りすぎる人の止め方」。',
      mean: 'Ron は昔のやり方を教え、それが後半の作戦になる。',
      trap: 'thorn や slacker が残ると、反対者や怠け者の話に思える。Here’s my question のあとが本題。',
      use: 'Here’s my real question.（本当に聞きたいのはこれ）' },

    // R fix: V2: the apology and history-lesson choices were easy to drop; replaced with two readings of her line.
    // why: argues ← "history" heard as an earlier agreement she brings up; quick ← "I don’t have time" heard as a promise to be brief
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'history', seg: [65.3, 68.9],
      stem: 'When Ron says she just walked in, how does Leslie answer?',
      choices: ['She brushes it off and goes straight to her point', 'She argues that he did agree to see her before', 'She agrees, then says the meeting will be quick'], a: 0,
      cue: 'Ron の文句のすぐあと、Leslie の一文。',
      line: 'You just walked in here and started talking. — *I don’t have time for a history lesson*.',
      said: '「勝手に来た」と言われ、「昔話の暇はない」と返して本題に入る。',
      mean: '相手の文句を「長い話」扱いして流し、謝らずに用件へ進む。',
      trap: 'no time を「手短にします」と取りやすい。no time for ～ は「その話はいい」と流す言い方。',
      use: 'I don’t have time for this.（そんな事に付き合う暇はない）' },

    // why: build ← "parking" heard as a parking lot (the scene is about lots); hire ← "a guy in public works" heard
    //   as the goal
    { id: 'd2', skill: 'detail', level: 'B1', point: 'meters', seg: [68.85, 73.0],
      stem: 'What does Leslie tell Ron she is trying to do?',
      choices: ['Remove the city’s parking meters', 'Build a new public parking lot downtown',
                'Hire a new guy for public works'], a: 0,
      cue: 'I am trying to のあと、最初の動詞。',
      line: 'Look, I am trying to *remove parking meters*.',
      said: '「パーキングメーターを撤去しようとしてる」と話す。',
      mean: 'これは Ron に本当の相談を隠すための作り話の入り口。',
      trap: 'parking と public が聞こえると、駐車場や採用の話に思える。trying to の直後の動詞を聞く。',
      use: 'I’m trying to cut down on sugar.（砂糖を減らそうとしてるの）' },

    // why: sharp ← thorn read as 鋭い (sharp mind); quiet ← "about it" heard as keeping a secret
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'thorn', seg: [72.9, 77.27],
      stem: 'What does Leslie say the guy in public works is being?',
      choices: ['A real pain about it', 'Really sharp about it', 'Very quiet about it'], a: 0,
      cue: 'public works の男の話、植物の一語。',
      line: 'there is a guy in public works who’s being *a real thorn* about it.',
      said: '「公共事業課の男が、それでかなり邪魔をしてくる」と言う。',
      mean: 'a thorn (in my side) ＝ 悩みの種、困った人。ここでは短く言っている。',
      trap: 'thorn を「とげ＝鋭い」と取ると「頭が切れる」に聞こえる。刺さって痛い物、と覚える。',
      use: 'That printer is a thorn in my side.（あのプリンターは悩みの種）' },

    // R fix: V2/K5: “What’s his deal?” in the stem pointed at “him”, and “had heard him” didn’t fit; now four forms that fit “Never ___.”
    // why: them ← him loses its h and sounds like "em"; from ← of heard as from; about ← the same meaning, with an extra weak syllable imagined
    { id: 's1', skill: 'sound', level: 'B2', point: 'heardof', seg: [77.25, 81.5],
      stem: 'Fill the gap in Ron’s reply: “Never ___.”',
      choices: ['heard of him', 'heard of them', 'heard from him', 'heard about him'], a: 0,
      cue: '名前を聞いたあと、Ron の最初の短い文。',
      line: '*Never heard of him*. What’s his deal?',
      said: '「聞いたことないな。どんなやつだ？」と返す。',
      mean: 'heard of him が「ハードヴィム」と一続き。him の h が落ちて of とつながる。',
      trap: 'him の h が消えると them にも聞こえる。直前の名前が一人なら him と考える。',
      use: 'Never heard of it. Is it new?（聞いたことない。新しいの？）' },

    // R fix: V2: two money choices against one abstract key; one distractor is now a non-money question.
    // why: paying ← cost read as money (費用); so long ← "used to be a slacker" heard as the topic of the question
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'cost', seg: [81.5, 86.45],
      stem: 'After describing the new guy’s rise, what does Leslie’s short question mean?',
      choices: ['What is he giving up along the way?', 'How much is the city now paying him?', 'Why did it take him so long to change?'], a: 0,
      cue: 'full potential のあと、But で始まる短い問い。',
      line: 'now he’s realizing his full potential. *But at what cost?*',
      said: '「怠け者だったのに、今は力を出し切ってる。でも、何と引き換えに？」',
      mean: 'at what cost ＝ 代わりに何を失っているのか。成長を心配する大げさな言い方。',
      trap: 'cost を「お金」と取りやすい。at what cost? は代償を問う決まり文句。',
      use: 'He got the job, but at what cost?（仕事は取れた。でも代償は？）' },

    // R fix: V2: “gives away that he is a woman” spelled out the cover story; the choices are now three readings of the correction.
    // why: crush ← "smart and beautiful" + "that would be crazy" heard as denying a crush; tease ← "daughter" heard as said on purpose
    { id: 'h4', skill: 'humor', level: 'C1', point: 'daughter', reveals: ['ricky'], seg: [86.45, 92.8],
      stem: 'Why does Leslie’s line about thinking of him “in many ways” get a laugh?',
      choices: ['She slips and calls him a daughter, then backtracks', 'She praises his looks, then denies any crush', 'She calls a grown man a daughter to tease him'], a: 0,
      cue: 'daughter のあと、慌てて足す説明。',
      line: 'I think of him in many ways as a *daughter*, but that would be crazy because *he’s a man*.',
      said: '「娘みたいに思ってる。でも変ね、男だから」と付け足す。',
      mean: 'daughter と言ってしまい、作り話がばれかける。実は April のこと。',
      trap: 'smart and beautiful を素直に取ると恋の話に聞こえる。言い直しが手がかり。',
      use: 'I mean — he. He’s a guy.（じゃなくて、彼。男の人）' },

    // R fix: V2: “like her own self” was the only choice that fit a word made from “me”; two choices are now “Too much like her … self”.
    // why: careless ← "me" heard as her past self, with "slacker" just said; selfish ← me read as self-centered (自己中)
    { id: 'p3', skill: 'phrase', level: 'C1', point: 'meish', seg: [92.6, 98.6],
      stem: 'What does Leslie mean by the word she makes up in her question?',
      choices: ['Too much like her own eager, driven self', 'Too much like her old, careless younger self', 'Too focused on herself and what she wants'], a: 0,
      cue: 'slow me down のあと、最後の作り言葉。',
      line: 'How did you used to slow me down when I was becoming *too me-ish*?',
      said: '「私が私っぽくなりすぎた時、どう止めてたの？」と聞く。',
      mean: 'me-ish ＝ 私らしい。ここでは張り切りすぎる Leslie の性格のこと。',
      trap: 'me から「自己中」と取りやすい。slow me down と並ぶので、勢いの話だと分かる。',
      use: 'Sorry, I got a little too me-ish.（ごめん、ちょっと私らしすぎた）' },

    // R fix: V2/N7: the key said “brochure”, which a1’s stem names; the key no longer quotes the example. B1: its stem presupposes g1’s key, so it reveals plan.
    // why: meetings ← "slow me down" heard as wearing her out; days off ← slow down read as rest
    { id: 'd4', skill: 'detail', level: 'B1', point: 'busywork', reveals: ['plan'], seg: [98.6, 105.4],
      stem: 'What does Ron say he sometimes did to slow Leslie down?',
      choices: ['Gave her pointless tasks to keep her busy', 'Sent her to long meetings to tire her out', 'Gave her days off so she could calm down'], a: 0,
      cue: 'Sometimes で始まる文の、最後の2語。',
      line: 'Sometimes I’d just give you *busy work*.',
      said: '「時々、ただの暇つぶしの仕事を渡した。土の種類のパンフレットとか」と言う。',
      mean: 'busy work ＝ 忙しくさせるだけで、大事ではない仕事。',
      trap: 'slow down から休みを思い浮かべやすい。give you のあとの名詞を聞く。',
      use: 'This report is just busy work.（この報告書は形だけの仕事だよ）' },

    // R fix: V2: “thanks him” was easy to drop; replaced with a hurt reading.
    // why: jokes ← the pun that follows heard as laughing it off; hurt ← the waffle reaction that comes next, moved earlier
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'brochure', reveals: ['busywork'], seg: [98.6, 110.35],
      stem: 'How does Leslie take Ron’s brochure example?',
      choices: ['She insists it was real work that mattered', 'She jokes about it but admits it was pointless', 'She is hurt that he never told her the truth'], a: 0,
      cue: 'brochure のあと、Leslie の was not。',
      line: 'That soil brochure *was not busy work*. I mean, people still refer to…',
      said: '「あのパンフレットは暇つぶしじゃない。今でもみんな参考にしてる」と言い返す。',
      mean: '自分の仕事を守ろうとしてむきになっている。I mean のあとで根拠を足す。',
      trap: '続くだじゃれで笑って認めたように聞こえる。was not のあとの言い分で決める。',
      use: 'That was not a waste of time.（あれは時間のむだじゃなかった）' },

    // R fix: V2: the distractors were weak; all three now name a feeling plus its cause.
    // why: amused ← the laugh after the line heard as hers; touched ← a planned outing heard as care
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'friendship', reveals: ['purposes'], seg: [110.35, 120.2],
      stem: 'How does Leslie feel when she hears why Ron took her to JJ’s?',
      choices: ['Let down that the treat was really a trick', 'Amused that the trick worked on her so well', 'Touched that he went to so much trouble'], a: 0,
      cue: 'Those are のあとの問いと、I thought のあと。',
      line: 'Those are *distraction waffles*? I thought they were *friendship waffles*.',
      said: '「気をそらすワッフルだったの？友情のワッフルだと思ってた」と言う。',
      mean: '楽しい思い出に別の目的があったと知って、がっかりしている。',
      trap: '計画した、と聞くと気づかいに思える。I thought ～ は「思っていたのに違った」の形。',
      use: 'I thought it was a gift!（プレゼントだと思ってた！）' },

    // R fix: V2: the key was the only two-sided choice; the choices are now three “The waffles were …” readings.
    // why: only tactic ← "distract you with waffles" heard as the whole truth; teasing ← the calm reply heard as a joke that takes it back
    { id: 'i2', skill: 'infer', level: 'C1', point: 'purposes', reveals: ['friendship'], seg: [113.5, 122.6],
      stem: 'What does Ron’s answer about breakfast food tell Leslie?',
      choices: ['The waffles were a treat and a tactic at once', 'The waffles were only a tactic, never a treat', 'The waffles were only a treat; he is teasing'], a: 0,
      cue: 'Leslie の問いへの、Ron の一文の many。',
      line: 'distract you with waffles. … *Breakfast food can serve many purposes*.',
      said: '「朝ごはんにはいろいろな役目がある」と、否定も謝りもせずに答える。',
      mean: '友情でもあり作戦でもあった、と静かに認めている。',
      trap: 'distract だけ聞くと「作戦だけ」に聞こえる。many purposes は「両方」を認める言い方。',
      use: 'A good coat serves many purposes.（いいコートはいろいろ使える）' },

    // R fix: V2: the key spelled out its own reasoning, and “give away” in the stem pointed at a secret; now plain claims, with “suggest” in the stem.
    // why: doubted ← "Never heard of him" heard as doubt, so "who is real" sounds like an answer; ought to know ← "this person, this Ricky" heard as a reminder
    // anchor: 80.2 s Ron: “Never heard of him”; 122.8–124.8 s “this person, this Ricky, who is real”: nobody asked
    //   whether Ricky is real
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'ricky', reveals: ['daughter'], seg: [120.3, 128.3],
      stem: 'What does Leslie’s extra remark about Ricky suggest?',
      choices: ['That Ricky is not a real person at all', 'That Ron had doubted Ricky was real', 'That Ricky is someone Ron ought to know'], a: 0,
      cue: 'this Ricky のあと、誰も聞いていない一言。',
      line: 'But what if this person, this Ricky, *who is real*, doesn’t like waffles or anything?',
      said: '「もしこの人、この Ricky、実在の人ね、がワッフルを好きじゃなかったら？」と聞く。',
      mean: '誰も疑っていないのに「実在する」と付け足すと、作り話だと自分で言っているのと同じ。',
      trap: '念を押す一言は本当らしく聞こえる。聞かれていない事を強く言う時は、逆を疑う。',
      use: 'And I’m not nervous, by the way.（ちなみに、緊張なんかしてないから）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'passionate', seg: [128.2, 131.2],
      stem: 'Type Ron’s line: “Everybody has something ___.” (3 words)', answer: 'they\'re passionate about',
      cue: 'something のあと、短い語から始まる。',
      line: 'Everybody has something *they’re passionate about*.',
      said: '「誰にでも夢中になれる物がある」。',
      mean: 'be passionate about ＝ 〜に熱中している。about が文の最後に残る形。',
      trap: 'they’re は弱く「ゼア」と短い。文末の about も弱いが落とさない。',
      use: 'What are you passionate about?（何に夢中なの？）' },

    // R fix: V2: the distractors were Ron’s earlier tricks, which made the key the only new one; all three are now “Find what he …”. B1: its stem presupposes g1’s key, so it reveals plan.
    // why: reward ← "passionate about" heard as a prize to dangle; hates ← busy work from before, carried over as a punishment
    { id: 'd6', skill: 'detail', level: 'B2', point: 'advice', reveals: ['plan'], seg: [128.2, 136.2],
      stem: 'What is Ron’s advice for slowing this person down?',
      choices: ['Find what he loves, show interest, then steer him', 'Find what he loves, praise it, then reward him', 'Find what he hates, then give him more of it'], a: 0,
      cue: 'Just figure out で始まる文の、3つの動作。',
      line: 'Just *figure out what it is*, *express an interest in it*, and *divert his attention*.',
      said: '「夢中な物を見つけ、興味を見せて、注意をそらせ」と教える。',
      mean: 'divert ＝ 向きを変える。好きな物の方へ気持ちを向けさせる作戦。',
      trap: 'passionate だけだと「ごほうび」に思える。divert まで聞いて決める。',
      use: 'Try to divert his attention.（気をそらしてみて）' },

    // R fix: V2: “so the love is real” was a weak foil next to the key; now a show-off reading and a false-friend reading of “heavy”.
    // why: sound smart ← a long, rare word heard as showing off; strong message ← heavy read as weighty (重厚)
    { id: 'h7', skill: 'humor', level: 'C1', point: 'heavy', seg: [182.65, 187.5],
      stem: 'Asked for a favorite part of the show, why does the answer get a laugh?',
      choices: ['Her answer names a flaw, which gives her away', 'Her answer is a big word used to sound smart', 'Her answer praises the show’s strong message'], a: 0,
      cue: 'favorite part の答えの一語。ほめ言葉かどうか。',
      line: 'You hate this show. — I love this show. — What’s your favorite part? — *The heavy-handedness*.',
      said: '「この劇、嫌いでしょ」「大好き」「どこが一番？」「くどいところ」と続く。',
      mean: 'heavy-handed ＝ くどい、押しつけがましい。好きな所に欠点を挙げた。',
      trap: 'heavy を「重厚」と取るとほめ言葉に聞こえる。-handed が付くと「くどい」。',
      use: 'The ending was a bit heavy-handed.（結末がちょっとくどかった）' },

    // R fix: V2/N7: “a cleaner lot” gave d1 away; it’s replaced with a Jam reading.
    // why: another lot ← the dirty lot from the opening, carried into Jam’s reaction; arts ← the suggestion just made, heard as where the plan went
    { id: 'g2', skill: 'gist', level: 'B2', point: 'jam', seg: [187.5, 208.5],
      stem: 'By the end, where does April’s dog park plan stand?',
      choices: ['A councilman will back it at tomorrow’s meeting', 'A councilman likes it but wants another lot', 'It is set aside while she runs an arts program'], a: 0,
      cue: 'because のあと、相手の反応と、いつの話か。',
      line: 'I told him about the dog park idea and he loves it… He’s going to *support my motion*…',
      said: '「Jam 議員が気に入って、明日の議会で私の案を支持してくれる」と言う。',
      mean: '気をそらす作戦は効かず、April は議員の後ろ盾まで得ていた。',
      trap: '直前の芸術の話が残ると、計画がそちらに移ったように聞こえる。tomorrow の文で決める。',
      use: 'She’s going to support my plan.（彼女は私の案を支持してくれる）' },

    // R fix: V2: “warning” fit only the key; all three are now warnings.
    // why: bites ← snake read literally (かみつく); cold ← snake read as cold-blooded
    { id: 'p4', skill: 'phrase', level: 'B1', point: 'snake', seg: [201.7, 206.05],
      stem: 'What is the warning about Jam?',
      choices: ['He can’t be trusted', 'He bites when he’s angry', 'He’s cold toward people'], a: 0,
      cue: 'careful with Jam のあと、動物の一語。',
      line: 'you should be careful with Jam. *He’s a snake*.',
      said: '「Jam には気をつけて。あの人は信用できない」と言う。',
      mean: 'a snake ＝ 裏切る人、ずるい人。careful と並べて警告している。',
      trap: '動物の特徴から「かみつく」や「冷たい」と考えやすい。人に使う snake は裏切りの意味。',
      use: 'Watch out for him. He’s a snake.（あいつに気をつけて。ずるいやつだ）' },

    // why: agrees ← "I should trust you" taken at face value; asks ← the line heard as a real question about why
    { id: 'a4', skill: 'attitude', level: 'C1', point: 'trust', seg: [201.7, 208.5],
      stem: 'When April is warned about Jam, what does her reply mean?',
      choices: ['She won’t listen to someone who tricked her', 'She will trust that warning over Jam’s promise',
                'She wants to know why she should believe it'], a: 0,
      cue: 'Yeah のあとの like と、out of all people。',
      line: 'Yeah, *like I should trust you* out of all people right now.',
      said: '「よりによって今あなたを信じろって？」と返す。',
      mean: 'この like は「まさか」の皮肉。だました相手の忠告は聞かない、という拒否。',
      trap: 'I should trust you を文字どおり取ると同意に聞こえる。Yeah, like… は逆の合図。',
      use: 'Yeah, like that’s going to happen.（はいはい、そんなわけないでしょ）' },
  ]
};
