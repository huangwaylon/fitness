// “Leslie's Black Eye | Parks and Recreation” (the official Parks and Recreation channel, Season 6): Leslie visits
// Eagletonians who got stung to apologize, an Eagleton TV reporter ambushes her, Jamm turns her peace plea into a call
// to secede, the report spins it, a scuffle breaks out, and later a friend brings Leslie "good news" that isn't.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈129 s. Untested: 25–30 s (“Wanna come
// up? … Gotta get this. Roll camera” vs “look him up … got to get him. Oh, camera”), 84–103 s (the insults and the
// scuffle), 105–113 s beyond the outfit line (who says “It's working”), and the “dirty mags”/“filth” lines.
// REVIEW 2026-11-16: pass 7, fix 15, drop 1, new 0; ear checks 2
// EAR CHECK: 63.6 s w2 nt3 — “Awesome idea, Leslie. Matter of fact, I say we should secede” is taken as Jamm's (it
//   names Leslie, so it isn't hers; Mike then pairs “Councilman Jeremy Jamm” with the movement). nt3's seg starts
//   at “Matter of fact”, so there it rests on the voice: confirm it's a man's, not Leslie's
// EAR CHECK: 115.9 s r1 — the cut falls right after “there is some good news”, before “That Mike Patterson guy's show”
import type { Clip } from '../types.ts';

export const lesliesBlackEye: Clip = {
  id: 'blackeye', video: 'Ybgfeqiq2Fk', title: 'Leslie’s Black Eye', dur: 150, wpm: 160,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: news piece ← the reporter and cameras arrive in this stretch; who caused it ← "got stung" heard as an
    //   incident she is looking into
    { id: 'g1', skill: 'gist', level: 'B1', point: 'apology', seg: [0, 47.75],
      stem: 'Why has Leslie come to see the people at the start?',
      choices: ['To say sorry to the people who were injured', 'To film a TV news piece about the injuries',
                'To find out who was to blame for the injuries'], a: 0,
      cue: '「This is not…」のあと、彼女が来た目的を言う所。',
      line: 'I just came here by myself *to apologize* to all the Eagletonians who got stung.',
      said: '「一人で来たの。刺された人たちに謝るために」と説明する。',
      mean: 'apologize ＝ 謝る。お見舞いのかごを配りに来た。撮影は記者の側の事情。',
      trap: 'カメラと記者が出てくるので取材に見えるが、本人は撮影を否定している。',
      use: 'I came by to apologize in person.（直接謝りに来ました）' },

    // R fix: V2/K3 (blind 70 %): "about her" was absurd and the key the only kind-but choice. Now a near sound
    //   (less/more) and an order trap.
    // why: worse ← "less" heard as "more" at speed; rude-but-thanked ← "That's very kind of you" heard as the reply to
    //   the wish, though it comes before it
    { id: 'h1', skill: 'humor', level: 'C1', point: 'gross', seg: [0, 7.5],
      stem: 'What is funny about the get-well wish at the very start?',
      choices: ['She means well, but bluntly calls him gross', 'She means well, but says he’ll soon look worse',
                'She is rude, and he thanks her for it anyway'], a: 0,
      cue: '最初の「sorry」と、最後の一文の言葉選びの差。',
      line: 'I am so incredibly sorry. … I hope you *look a lot less gross* very soon.',
      said: '謝ったあと「早く気持ち悪くなくなるといいね」と言う。',
      mean: '早く治ってね、という優しい気持ちを、見た目が「気持ち悪い」と言う形で伝えてしまう。',
      trap: 'less を more と聞くと逆の意味になる。お礼の言葉はこの一文より前。順番を追って聞く。',
      use: 'Hope you feel better soon.（早く良くなるといいね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'gross', seg: [2.2, 7.5],
      stem: 'Type the words: “I hope you look ___ gross very soon.” (3 words)', answer: 'a lot less',
      cue: '「look」のすぐあと。短い語が3つつながる。',
      line: 'I hope you look *a lot less* gross very soon.',
      said: '「早く、ずっとましな見た目になるといいね」。',
      mean: 'a lot less ＋形容詞 ＝ ずっと〜でない。a lot more の反対の形。',
      trap: 'lot の t はほぼ聞こえず「アラッレス」に近い。最初の a を落として書きやすい。',
      use: 'It’s a lot less crowded today.（今日はずっと空いてるね）' },

    // why: everyone ← "Eagletonians who got stung" is said too, later; laughed ← "laughing at other people's pain" is
    //   said, but about who does NOT get one
    // R fix: B1: the reveal `laughing` named no point (i1 already shares `baskets`); removed.
    { id: 'd1', skill: 'detail', level: 'B1', point: 'baskets', seg: [13.8, 21.5],
      stem: 'Who does Leslie say the gift baskets are for?',
      choices: ['People who got stung and did nothing wrong', 'Everyone in Eagleton who got stung',
                'People who laughed when others got hurt'], a: 0,
      cue: '「gift baskets are for」のすぐあと。',
      line: 'these gift baskets are for *innocent victims*, not for jerks who got stung…',
      said: '「かごは罪のない被害者用。イヤなやつ用じゃない」と言う。',
      mean: 'innocent victims ＝ 何も悪くないのに被害にあった人。not for のあとは、もらえない人。',
      trap: '刺された人全員ではない。not for のあとの人を、もらう側と取らない。',
      use: 'This is for kids, not for grown-ups.（これは子ども用で、大人用じゃない）' },

    // R fix: V2/K3 (blind 55 %): "felt no pain at all" was absurd. Now a keyword trap (pain) and the default
    //   script (bad luck).
    // why: ease pain ← "other people's pain" is said, in another relation; unlucky ← the common-sense reading, which
    //   "because they were laughing" rules out
    { id: 'i1', skill: 'infer', level: 'B2', point: 'baskets', seg: [13.8, 21.5],
      stem: 'What does Leslie’s answer suggest about how Jamm got stung?',
      choices: ['He was laughing at others who got hurt', 'He was trying to ease other people’s pain',
                'He was just unlucky, like everyone else'], a: 0,
      cue: '「not for jerks」のあと、because 以下の理由。',
      line: 'not for jerks who got stung *because they were laughing at other people’s pain*.',
      said: '「人の痛がる姿を笑っていて刺されたやつにはあげない」と言う。',
      mean: '名前は出さないが、かごをねだるジャムがその「イヤなやつ」だとほのめかしている。',
      trap: 'pain が聞こえても、痛みを和らげようとした話ではない。because のあとが刺された理由。',
      use: 'That’s what you get for laughing.（笑ったりするからだよ）' },

    // R fix: V2 (blind 65 %): only the key was a reading of her words. All three now say whose cameras they are.
    // why: hers ← "your" heard as "our" (a weak vowel at speed); victims' ← "your" heard as "their", and "these"
    //   seems to point at the victims
    { id: 'h2', skill: 'humor', level: 'C1', point: 'cameras', seg: [30.4, 42.1],
      stem: 'Why is Leslie’s first reply to Mike funny?',
      choices: ['They’re his own cameras, so the charge fits him', 'They’re her own cameras, so she admits the charge',
                'They’re the victims’ cameras, so nobody is shoving'], a: 0,
      cue: '「shoving cameras」と、彼女の短い返事を比べて。',
      line: 'shoving cameras into the faces of these poor, injured victims. — These are *your* cameras.',
      said: '「被害者にカメラを突きつけて」と言う記者に、「あなたのカメラでしょ」と返す。',
      mean: 'カメラを突きつけているのは記者自身。非難がそのまま本人に当てはまる。',
      trap: 'your は弱く速く、our や their に紛れやすい。誰の物かの一語を聞き分ける。',
      use: 'Says the guy who started it.（始めたのはそっちでしょ）' },

    // R fix: V2/K3 (blind 70 %): "risky, like a film action scene" was absurd. S4: seg 30.4–47.75 (17.4 s) →
    //   32.6–43.6, which still holds her denial.
    // why: faking ← "stunt" as a staged act, with "injured victims" right after; paid ad ← "publicity" ≈ 宣伝, heard
    //   as advertising
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'stunt', seg: [32.6, 43.6],
      stem: 'What is Mike accusing Leslie of when the live report begins?',
      choices: ['Doing something just to get attention', 'Faking an injury in front of the cameras',
                'Running a paid ad for herself on TV'], a: 0,
      cue: '「in the middle of a crass」のあとの2語。',
      line: 'who’s in the middle of a *crass publicity stunt*',
      said: '「悪趣味な売名行為の真っ最中のレスリー」と生中継で言う。',
      mean: 'publicity stunt ＝ 注目を集めるためだけの行動。レスリーはすぐ否定する。',
      trap: 'stunt を「やらせ」と取ると、けがのふりに聞こえる。人目を引く行動の意味もある。',
      use: 'It’s just a publicity stunt.（ただの話題作りだよ）' },

    // R drop: nt1 (C2 stress on "your"), V2/V3: blind 70 %, because the reasons in the choices make "your" the
    //   only sensible one, and it tests the same fact as h2 (point `cameras`). Deleted (never shipped).

    // R fix: V2 (blind 55 %): "say it once more" was a filler. Now a keyword trap (by myself) and a warm reading.
    // why: surprised ← "by myself" is the last thing she says; welcoming ← "Really?" as a happy surprise (ほんと？)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'really', seg: [40.5, 52.75],
      stem: 'When Mike answers Leslie’s claim with a one-word question, what is he doing?',
      choices: ['Doubting what she has just told him', 'Showing surprise that she came alone',
                'Welcoming the news that she came to say sorry'], a: 0,
      cue: '一語の質問のあと、Because で何を続けるか。',
      line: '*Really?* Because all we see is you talking to your friend…',
      said: '「謝りに来た」と言うと「本当に？友達と話しているだけだ」と返される。',
      mean: 'Really? ＋ Because… は、相手の言い分を疑って反論する形。',
      trap: '日本語の「ほんと？」の感覚で好意的に取りやすい。すぐ Because が来たら反論の合図。',
      use: 'Really? Because you said yesterday…（本当に？昨日は…って言ったよね）' },

    // R fix: V2 (blind 55 %): "a stranger" and "hurt" were weak. Now the "uh" read as doubt, and a correction read as
    //   coming to her defence.
    // why: unsure ← the "uh" before "best friend" heard as doubt; defending ← a correction heard as taking her side
    //   (the Japanese フォロー frame)
    { id: 'h3', skill: 'humor', level: 'C1', point: 'bestfriend', seg: [47.65, 54.9],
      stem: 'When Mike’s “your friend” gets corrected, why is it funny?',
      choices: ['It makes Leslie look even closer to Jamm', 'It makes Jamm sound unsure he knows Leslie',
                'It makes Jamm sound like he’s defending Leslie'], a: 0,
      cue: '「Excuse me, Mike」のあと、何を直して何を直さないか。',
      line: 'your friend, known Eagleton hater, Jeremy Jamm. — Excuse me, Mike. That’s, uh, *best friend*.',
      said: '「ジャムと友達」と言われ、「いや、親友だ」と訂正が入る。',
      mean: 'レスリーに不利な点を打ち消すどころか強める訂正。hater の方は直さない。',
      trap: 'かばう訂正に聞こえやすいが、friend を best friend に上げ、不利を強めている。',
      use: 'Actually, it’s best friend.（正確には、親友ね）' },

    // R fix: V2/S2 (blind 70 %): the stem quoted "come together", which pointed at the key. Now a neutral stem, and
    //   distractors from what is said.
    // why: blame ← "who bailed out who" heard as the thing to settle; one town ← "come together" read literally, and
    //   "merge" comes soon after
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'hatchet', seg: [54.9, 63.5],
      stem: 'What does Leslie want the two towns to do?',
      choices: ['Stop fighting and let the past go', 'Settle who was to blame first',
                'Join together into one town again'], a: 0,
      cue: '「come together」のあとの3語と、I mean 以下。',
      line: 'need to find a way to come together and *bury the hatchet*.',
      said: '「二つの町は歩み寄って、争いをやめるべき」と言う。',
      mean: 'bury the hatchet ＝ 仲直りする。「どっちが助けたかは関係ない」と過去を水に流す。',
      trap: 'come together を文字通り「一つになる」と取りやすい。慣用句は続く文で確かめる。',
      use: 'Let’s bury the hatchet, okay?（もう水に流そうよ）' },

    // why: takes back ← the phrase heard as a self-correction (言い直し); unsure ← a softener read as doubt
    { id: 'mk1', skill: 'marker', level: 'B2', point: 'imean', seg: [54.9, 63.5],
      stem: 'Right after her line about coming together, what does Leslie’s next short phrase do?',
      choices: ['It leads into a plainer version of her point', 'It takes back the point she has just made',
                'It shows that she isn’t sure of her point'], a: 0,
      cue: '「hatchet」のすぐあとの2語と、そのあとの中身。',
      line: '…bury the hatchet. *I mean*, it doesn’t matter who…',
      said: '「争いをやめよう。つまり、どっちが何をしたかは関係ない」と続ける。',
      mean: 'I mean はここでは「つまり」。言ったことを具体的に言い直す合図。',
      trap: '訂正にも使うが、ここは同じ方向の話が続く。あとの中身で訂正か補足かを見分ける。',
      use: 'It’s fine. I mean, it’s not perfect.（大丈夫。まあ、完ぺきじゃないけど）' },

    // R fix: N6: a broken character in the trap (習った��法 → 習った文法). a2's mean had the same (＝).
    // why: whom ← the grammar instinct "fixes" the second who; the reduced "doesn't" and linked "bailed out" are lost
    //   at speed
    // anchor: 59.8–61.6 s both sources have “it doesn't matter who bailed out who”, ≈ 200 wpm, then the same pattern
    //   again (“who seceded from who”)
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'whowho', seg: [59.35, 63.5],
      stem: 'Type the words after “I mean, it”: “___ or who seceded from who.” (6 words)',
      answer: 'doesn\'t matter who bailed out who',
      cue: '「I mean」のすぐあと。文法より、聞こえた音を。',
      line: 'I mean, it *doesn’t matter who bailed out who* or who seceded from who.',
      said: '「どっちが助けたとか関係ない」。6語が速くひと続きに聞こえる。',
      mean: '会話では whom でなく who を使う。doesn’t は弱く、bailed out はつながって「ベイルダウト」。',
      trap: '習った文法で最後を whom と書きたくなる。書き取りは正しい形でなく、言われた音を書く。',
      use: 'Who cares who said what?（誰が何を言ったかなんてどうでもいい）', retired: true },

    // why: peace too ← "Awesome idea" taken at face value; won't work ← praise read as sarcasm about her plan
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'awesome', reveals: ['secede', 'matter'], seg: [63.45, 68.05],
      stem: 'When Jamm calls Leslie’s plan an awesome idea, is he agreeing?',
      choices: ['No; he uses it to bring in the opposite plan', 'Yes; he wants the towns to make peace too',
                'No; he is mocking it as a plan that won’t work'], a: 0,
      cue: 'ほめ言葉のすぐあと、「Matter of fact」以下の提案。',
      line: 'Awesome idea, Leslie. Matter of fact, I say we should *secede from Eagleton*.',
      said: '「すごくいい考えだ。というか、独立すべきだ」と言う。',
      mean: 'ほめておいて、歩み寄りと正反対の「分離」を言い出す。賛成の形で話をひっくり返す。',
      trap: 'Awesome をそのまま賛成と取りやすい。ほめたあとの提案で本心を聞く。',
      use: 'Great idea. Even better, let’s…（いいね。いっそのこと…）' },

    // why: "As a" ← the full textbook phrase a learner "hears" by habit; "And that's a" ← the sounds a, t, f heard
    //   in the wrong order
    { id: 's1', skill: 'sound', level: 'B2', point: 'matter', seg: [63.45, 68.05],
      stem: 'Fill the gap: “Awesome idea, Leslie. ___, I say we should…”',
      choices: ['Matter of fact', 'As a matter of fact', 'And that’s a fact'], a: 0,
      cue: '「Leslie」のすぐあと。最初の音は短い。',
      line: 'Awesome idea, Leslie. *Matter of fact*, I say we should…',
      said: '「それどころか」と前置きして案を出す。',
      mean: 'As a を落とした形。matter の t ははじいて「マラ」、of は弱く「マラヴファクト」。',
      trap: '教科書の As a matter of fact を補って聞きやすい。くだけた話では頭の語が落ちる。',
      use: 'Matter of fact, I was just leaving.（実はちょうど帰るところだった）' },

    // why: Leslie ← Mike's report pairs her with the movement; Mike ← "I say" heard as the reporter's own view
    { id: 'w2', skill: 'who', level: 'B2', point: 'secede', reveals: ['matter'], seg: [63.45, 68.05],
      stem: 'Who first says Pawnee should break away from Eagleton?',
      choices: ['Jamm', 'Leslie', 'Mike'], a: 0,
      cue: '名前を呼ぶ人と、呼ばれる人に注目。',
      line: 'Awesome idea, *Leslie*. Matter of fact, *I say we should secede*…',
      said: '「レスリー、いい考えだ」と呼びかけた人が「独立すべきだ」と言う。',
      mean: 'Leslie と呼びかけているので、本人ではない。we はパウニー側の人。',
      trap: 'あとの報道で彼女の名前が出るので、彼女の案に聞こえやすい。呼びかけで話し手を絞る。',
      use: 'I say we order pizza.（ピザ頼もうよ）' },

    // R fix: V2 (blind 65 %): "never shown" was refuted by "just aired" and "calm down" by the title. All three now
    //   say how it airs; the near miss is "nobody takes it seriously".
    // why: not serious ← "Everyone is angry" missed, and the bill heard as Jamm's own move; kind visit ← the apology
    //   and "come together" heard as what aired
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['secede', 'bill', 'goodnews'], seg: [63.45, 129.5],
      stem: 'How does Leslie’s peace-making visit turn out in the end?',
      choices: ['It airs as a split plan, and everyone is angry', 'It airs as a split plan, but nobody takes it seriously',
                'It airs as a kind visit, but Jamm still pushes a split'], a: 0,
      cue: '後半の「show just aired」以下の報告。',
      line: 'That Mike Patterson guy’s show just aired. *Everyone is angry*.',
      said: '謝罪の訪問が「独立運動」として放送され、みんなが怒り、法案まで出る。',
      mean: '仲直りのつもりの訪問が、記者とジャムの一言で正反対の結果になった。',
      trap: 'bill だけ耳に残ると、放送は無事だったと思いやすい。怒りの一言が結末。',
      use: 'Well, that backfired.（まあ、裏目に出たね）' },

    // R fix: S4: seg 54.9–79.2 (24.3 s) ran over 15 s. It now starts at "Matter of fact" (64.75–79.7, 14.95 s). The key
    //   turns on Leslie's "Mine", which answers the merge question, so the near miss is reading "Mine" as owning the
    //   split. It reveals `spin` (i2), because the notes show what she owned.
    // why: both ← Mike's report, the last thing heard; Leslie's plan ← "Mine. It was my idea" heard as owning the
    //   split, if "merge" is missed
    // anchor: 65.6–67.4 s a male voice, “I say we should secede from Eagleton”; 68.1–71.5 s “Whose … idea was it for
    //   them to merge anyway?” — “Mine. It was my idea”; 73.4–79.2 s Mike, “Leslie Knope and Councilman Jeremy Jamm
    //   are spearheading…”
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'secede', reveals: ['spin'], seg: [64.75, 79.7],
      stem: 'Going by what each one said, which summary of the split talk is fair?',
      choices: ['Jamm called for a split; Leslie owned only the merge', 'Leslie and Jamm both called for the split',
                'Leslie called for the split; Jamm backed her'], a: 0,
      cue: '分離を言う声、Mine が答えた質問、報道のまとめ。',
      line: 'I say we should secede… — Whose … idea was it for them to *merge* anyway? — *Mine.* … — …*Leslie Knope and Councilman Jeremy Jamm* are spearheading…',
      said: 'ジャムは「独立すべき」、レスリーは「合併は私の案」とだけ言い、記者は「二人が独立運動を率いる」と伝える。',
      mean: '報道が場面を書きかえた。Mine は merge への答えで、分離を言ったのはジャムだけ。',
      trap: '報道や Mine の一語に引っぱられやすい。短い答えは、何への答えかまでさかのぼる。',
      use: 'That’s not what happened at all.（実際はまったく違う）', retired: true },

    // R fix: S4: seg 63.45–79.2 (15.8 s) → 67.6–79.2, from “Whose… idea” on. S3: the cue gave "idea", a word only the
    //   key had. V2 (blind 55 %): "word for word" was a filler; it's now "softened the rude word".
    // why: softened ← heard as if she had used the rude word and Mike toned it down; a name ← the word was said a
    //   moment ago, but about the idea, not her
    { id: 'i2', skill: 'infer', level: 'C1', point: 'spin', seg: [67.6, 79.2],
      stem: 'When Mike sums up what Leslie just said, what has he done with her words?',
      choices: ['Turned “my idea” into her calling herself a fool', 'Softened the rude word she used about herself',
                'Repeated a name someone called her a moment ago'], a: 0,
      cue: '「Whose」で始まる質問への答えと、記者のまとめ。',
      line: 'Whose … idea was it for them to merge anyway? — Mine. It was my idea. — … *Self-proclaimed* …Leslie Knope',
      said: '「私の案」と答えると、記者は「自称バカのノープ」と伝える。',
      mean: 'バカと言われたのは案で、本人ではない。「私の案」を「自分はバカ」にすり替えた。',
      trap: 'self-proclaimed ＝ 自称、を信じやすい。本人が実際に言った語と比べる。',
      use: 'That’s not what I said.（そんなこと言ってない）' },

    // R fix: V2/K3 (blind 60 %): "ill after getting stung" was absurd (Mike wasn't stung). Now "I, for one" read as
    //   speaking for others.
    // why: tired of the beat ← "sick of it" heard as tired of a routine; speaking for ← "I, for one" heard as speaking
    //   on behalf of the victims
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'sick', seg: [71.95, 81.0],
      stem: 'What does Mike’s last remark show about him as a reporter?',
      choices: ['He’s taking a side instead of just reporting', 'He’s tired of covering Pawnee news every day',
                'He’s speaking up for the people he interviewed'], a: 0,
      cue: '「And I, for one」以下。誰の気持ちを言っているか。',
      line: 'are spearheading a Pawnee secession movement. *And I, for one, am sick of it*.',
      said: '「二人が独立運動を率いている。私としては、もううんざりだ」と締める。',
      mean: 'be sick of ＝ うんざりしている。中立なはずの記者が、自分の怒りを混ぜている。',
      trap: 'I, for one は「私個人は」。it は直前の独立運動で、毎日の仕事ではない。',
      use: 'I’m sick of waiting.（待つのはもううんざり）' },

    // R fix: K6: "completely" was an absolute only in a distractor; removed.
    // why: hide ← "distract" heard as "cover"; light ← an eye injury heard as needing shade
    { id: 'd2', skill: 'detail', level: 'B1', point: 'outfit', seg: [105, 110.5],
      stem: 'What does Leslie say her outfit is for?',
      choices: ['Drawing people’s eyes away from her black eye', 'Hiding her black eye from people’s view',
                'Keeping bright light off her black eye'], a: 0,
      cue: '「What are you wearing?」への答え。to のあとの動詞。',
      line: 'It’s to *distract people from* my black eye.',
      said: '服のことを聞かれ、「目のあざから気をそらすため」と答える。',
      mean: 'distract A from B ＝ AをBからそらす。隠すのでなく、派手な服に目を向けさせる。',
      trap: 'distract を「隠す」と取りやすい。from のあとが、見せたくない物。',
      use: 'Music helps distract me from the pain.（音楽で痛みがまぎれる）' },

    // R fix: V2/S1 (blind 65 %): the stem's "hesitant" and the key's "despite the opening" gave it away. Now a neutral
    //   stem, and the good-news-then-bad-news script as the near miss.
    // why: good then bad ← the usual "good news and bad news" script; small worry ← "good news" taken at its word
    // predict: the segment stops after "there is some good news"; the reveal plays the news
    { id: 'r1', skill: 'predict', level: 'B2', point: 'goodnews', seg: [105, 115.9], then: [115.9, 125.2],
      stem: 'After “there is some good news”, what kind of news follows?',
      choices: ['Only bad news, though it was called good', 'Good news first, and then some bad news',
                'Good news, with only one small worry'], a: 0,
      cue: '「good news」の前の、迷うような間と音。',
      line: 'Um, well, there is some good news. … *Everyone is angry*. … How is any of that good news?',
      said: '「いい知らせもある」と言ってから、みんな怒っている、法案が出る、と悪い話だけ並べる。',
      mean: 'Um, well のためらいは、言いにくい話の前ぶれ。明るい前置きはわざと。',
      trap: '言葉どおり良い話を待ちやすい。前置きの迷う音が、先の中身の合図になる。',
      use: 'Okay, so… good news and bad news.（えっと…いい知らせと悪い知らせがあって）' },

    // why: ban the show ← "Mike Patterson guy's show" is said just before; pay victims ← the stings and gift
    //   baskets from the first scene
    { id: 'd3', skill: 'detail', level: 'B2', point: 'bill', reveals: ['secede', 'goodnews'], seg: [118.55, 124.1],
      stem: 'What is Jamm going to do at the next city council meeting?',
      choices: ['Bring in a bill for Pawnee to split away', 'Bring in a bill to shut down Mike’s show',
                'Bring in a bill to pay the sting victims'], a: 0,
      cue: '「Jamm is introducing a」のあとの2語。',
      line: 'And Jamm is introducing a *secession bill* at the next city council meeting.',
      said: '「ジャムが次の市議会で、分離独立の法案を出す」と伝える。',
      mean: 'secession ＝ 分離・独立。テレビでの「独立すべき」が、本当に議会の話になった。',
      trap: '直前に番組の話が出るので、番組への対抗と取りやすい。bill の前の語を聞く。',
      use: 'They’re introducing a new bill.（新しい法案が出される）' },
  ]
};
