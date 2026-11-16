// REVIEW 2026-11-16: pass 2, fix 18, drop 0, new 0; ear checks 3
// “Ross Doesn't Want Pity Fudge | Friends” (the official Friends channel, Best of Season 3): Ross pitches a weekend of
// darts, the friends confess a ski trip, his “that's okay” sets off offers to stay, and he turns every one down.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 78 s; whisper's lines after 78 s are a
// loop. Untested: who says each “It'll be great for next weekend” (10–19 s), who says “Rachel's sister's cabin”, the
// cab (captions “Cal”, whisper “cab”, 53.5 s), and who makes the last offer (76 s). No item names Monica.
// EAR CHECK: 50.7 s w1 — the offerer is addressed “Phoebs” (whisper); captions have “thieves”
// EAR CHECK: 59.4 s p2 — whisper “a pity stay?”, captions “a pity day” (the key's “pity” agrees; the line says stay)
// EAR CHECK: 75.8 s pd1 — the cut falls after “Nobody stays.” and before “Well, then…”
import type { Clip } from '../types.ts';

export const pityFudge: Clip = {
  id: 'pityfudge', video: 'C6Yx3f50e3M', title: 'Ross Doesn\'t Want Pity Fudge', dur: 89, wpm: 218, band: 'fast',
  tags: ['友だち', 'お願い・断り'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2: "two days" sat in s1's stem and in g1's and p1's choices, and "one afternoon" was the odd one out.
    //   The choices are now all "two" plus a unit; the leaking items were reworded.
    // why: two hours ← the realistic length of a darts tournament; two weekends ← "weekend" is said four times right after
    { id: 'n1', skill: 'number', level: 'B1', point: 'days', reveals: ['whatdo'], seg: [0, 9.4],
      stem: 'How long would Ross’s darts event last?',
      choices: ['Two hours', 'Two days', 'Two weekends'], a: 1, keep: true,
      cue: 'What do you think? のすぐあと。',
      line: 'What do you think? *Two days of darts*. It’ll be great.',
      said: '新しいダーツボードで大会をしよう、「2日間ダーツ漬け、最高だろ」と誘う。',
      mean: 'two days of ~ ＝ 2日間ずっと~。週末をまるごと使う計画。',
      trap: 'このあと weekend が何度も出るので「2週末」と混ざりやすい。数字の直後の名詞まで聞く。',
      use: 'Three days of beaches. Sound good?（3日間ビーチ三昧、どう？）' },

    // R fix: V4/V2: "why can't they join" was a detail (the ski reason), and "skiing" sat in nt1's, i2's and d4's
    //   choices. Now a scene-level outcome for the first half; the point is renamed `away`.
    // why: darts moved ← the friends' "great for next weekend" taken as the deal; Ross joins the trip ← "invited to go
    //   skiing" heard as an invitation that takes him along
    { id: 'g1', skill: 'gist', level: 'B1', point: 'away', seg: [0, 41.5],
      stem: 'By the end of Ross’s “that’s okay”, where do things stand?',
      choices: ['The friends are off this weekend, and he’ll be alone', 'The darts move to next weekend, with all of them',
                'Ross is going along on the trip with the friends'], a: 0,
      cue: 'What’s going on? への答えと、彼の if 節。',
      said: '「どうしたの？」に、みんなは今週末スキーに行くと打ち明け、ロスは「ひとりになる」と言う。',
      mean: 'ダーツは延期にならず、みんなは出かけ、ロスは残される。',
      trap: '「来週末なら」で話がまとまったと思いやすい。ロスは No で断っている。結果は最後の返しで聞く。',
      use: 'We already have plans that weekend.（その週末はもう予定があって）' },

    // R fix: V2/N7: the stem quoted "Two days of darts" (n1's key), and "Why do you think?" didn't fit a pitch.
    //   "Don't you" (a tag after "huh?") replaces it; the stem, line and said no longer hold n1's number.
    // why: What did you ← "do" and "did" are both a weak "d" sound; Don't you ← "d'you" heard as the tag "don't you
    //   think?" after a pitch; What would you ← "do you" and "would you" both shrink to "dyu"
    { id: 's1', skill: 'sound', level: 'B2', point: 'whatdo', seg: [3.6, 9.4],
      stem: 'Fill the gap: “…my new dartboard, huh? ___ think?”',
      choices: ['What do you', 'What did you', 'What would you', 'Don’t you'], a: 0,
      cue: 'huh のあと、文頭がひと続きの音。',
      line: '…huh? *What do you* think?',
      said: '「ダーツ大会しよう、どう思う？」と反応を聞いている。',
      mean: 'What do you が「ワダユ」のように一つにつながる。do はほぼ消える。',
      trap: '過去の did と聞くと「どうだった？」になるが、まだやっていない計画の話。時制は話の中身で決める。',
      use: 'What do you think? Tacos tonight?（どう？今夜タコスは）' },

    // R fix: V2/S1: "insist on" told that Ross pushes back on the friends' date. Neutral stem, and a third choice of
    //   the same kind.
    // why: next weekend ← it's the phrase the friends keep offering; the weekend after next ← "next weekend" heard, and
    //   the "weekend" Ross says after it taken as one more step on
    { id: 'd1', skill: 'detail', level: 'B1', point: 'when', reveals: ['nextwk'], seg: [9.5, 19],
      stem: 'Which weekend does Ross want for the darts?',
      choices: ['This weekend', 'Next weekend', 'The weekend after next'], a: 0,
      cue: 'No, no, no のすぐあと。',
      line: 'It’ll be great for next weekend. — No, no, no, *this weekend*, guys.',
      said: '「来週末なら最高だね」と言われ、「いやいや、今週末だよ」と言い直す。',
      mean: 'this weekend ＝ 今度の週末。すぐにでも一緒にいてほしい。',
      trap: 'next weekend が2回聞こえるので、そちらを選びやすい。No のあとが本人の希望。',
      use: 'Not next week. This week.（来週じゃなくて、今週）' },

    // R fix: V2/K3: "asking to bring more people" was a filler and the key the only nuanced choice; the third
    //   choice also held n1's "two days". All three now read the same line three ways.
    // why: agreeing for this weekend ← "It'll be great" heard as a yes, "next" lost; too long ← the plan was "two days"
    //   just before, so a cut-down sounds like the objection
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'nextwk', reveals: ['when'], seg: [9.5, 19],
      stem: 'When the friends first answer the darts plan, what is their reply doing?',
      choices: ['Putting it off without saying why', 'Agreeing to play it this weekend',
                'Saying a whole weekend is too long'], a: 0,
      cue: '「It’ll be great」の後ろに付く一言。',
      line: 'It’ll be great *for next weekend*.',
      said: '「最高だね、来週末なら」と、ほめ言葉に日付を足して返す。',
      mean: 'ほめて日をずらすのは、角を立てない断り。今週末は無理だと伝えている。',
      trap: 'great だけ聞くと乗り気に聞こえる。ほめ言葉の後ろに条件が付いたら、断りのサイン。',
      use: 'Sounds great. Maybe another time?（いいね。また今度にしない？）' },

    // R fix: V2/K3: "hope Ross will come along" was a weak filler. Now the Japanese frame of hesitation as reluctance.
    // why: unsure they're invited ← "sort of" read literally as "half invited"; rather do darts ← the Japanese frame:
    //   言いよどみ read as not wanting to go
    { id: 'i1', skill: 'infer', level: 'C1', point: 'sortof', reveals: ['away'], seg: [22.2, 30],
      stem: 'When Ross asks what’s going on, what does the halting answer suggest?',
      choices: ['They expect the news to let Ross down', 'They’re not sure they’re really invited',
                'They’d secretly rather stay for darts'], a: 0,
      cue: 'we were のあとの言いよどみ。',
      line: 'Well, we were, *um, sort of* invited to go skiing.',
      said: '「えっと、まあ、スキーに誘われてて」と、um や sort of をはさんで言う。',
      mean: '言いにくい知らせの前置き。ロスががっかりすると分かっていて和らげている。',
      trap: 'sort of を「半分だけ」と取りやすい。ここは中身でなく言い方をぼかす語。',
      use: 'So, um, I sort of broke your mug.（あの、ちょっとマグを割っちゃって）' },

    // R fix: B1: reveals `ski` became `away` (g1's new point). Otherwise passed (blind 40 %, wrong).
    // why: mother's ← another two-syllable family word after "Rachel's", with the second 's blurred; Phoebe's sister's ←
    //   the family word kept, the owner taken from the name heard most in the clip
    { id: 'd2', skill: 'detail', level: 'B1', point: 'cabin', reveals: ['away'], seg: [23.5, 30],
      stem: 'Whose cabin are the friends going to?',
      choices: ['Rachel’s sister’s', 'Rachel’s mother’s', 'Phoebe’s sister’s'], a: 0,
      cue: 'you know のあと、所有を表す語が2つ続く。',
      line: 'You know, *Rachel’s sister’s cabin*.',
      said: '「ほら、レイチェルのお姉さんの山小屋」と付け足す。',
      mean: 'Rachel’s sister’s ＝ レイチェルの姉妹の。’s が2回重なっている。',
      trap: '’s が2回続くと前の名前を聞き落としやすい。最初の名前と次の家族の語を分けて聞く。',
      use: 'We’re staying at my cousin’s place.（いとこの家に泊まるんだ）' },

    // R fix: V2/K3: "a switch to a separate topic" was a filler and the key the only nuanced choice. All three now
    //   describe what follows "I mean" in his own words.
    // why: the okay is sincere ← "I mean" learned as つまり, a restatement that backs the okay; a plan for his weekend ←
    //   "first weekend… alone by myself" heard as him planning a weekend on his own
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['understand'], seg: [33, 41],
      stem: 'After “Yeah, that’s okay,” what does Ross’s next short phrase begin?',
      choices: ['A condition that takes the okay back', 'A reason why the okay is sincere',
                'A plan for his weekend on his own'], a: 0,
      cue: 'okay のあと、次の文の頭の短い2語。',
      line: 'Yeah, that’s okay. *I mean*, if you guys all have to go away…',
      said: '「うん、いいよ。っていうか、みんな行くなら最初の週末ひとりだけど」と続ける。',
      mean: 'I mean のあとに条件が来て、okay の中身が変わる。本当はよくない、と伝えている。',
      trap: '「つまり」と取ると okay の理由に聞こえる。後ろの if 節を聞く。',
      use: 'It’s fine. I mean, if you need it.（いいよ。まあ、要るなら）' },

    // why: partly ← the Japanese frame: sad but accepting (しかたない) is the polite reading; fully ← "totally, totally"
    //   taken at face value
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'understand', reveals: ['imean'], seg: [33, 41],
      stem: 'When Ross says he’ll “totally, totally understand”, how much does he mean it?',
      choices: ['Not at all; he wants them to stay', 'Partly; he’s sad but accepts it',
                'Fully; he’s glad they have plans'], a: 0, keep: true,
      cue: '直前の if 節で、自分をどう描いているか。',
      line: 'the first weekend *I’m alone by myself*, you know, then totally, totally understand.',
      said: '「最初の週末にひとりぼっちになるけど、全然、全然わかるよ」と言う。',
      mean: 'alone by myself と重ねて寂しさを強調する。わかるよ、は引き止めの裏返し。',
      trap: 'totally の2回で本気に聞こえる。同意の前に寂しい条件があれば、本音はそちら。',
      use: 'No, go. I’ll just be here alone.（いいよ行って。私はひとりでここにいるから）' },

    // anchor: 34.3–40.4 s "if you guys all have to go away… I'm alone by myself" (he never asks to come); 41.9 s the
    //   first reply is an offer to stay, and 72.9 s he answers the offers with "I don't need any of you to stay"
    // why: hurt not invited ← right mechanism, wrong wish: the ski invite was just mentioned, so he seems to want in;
    //   move the darts ← right topic, wrong direction: "next weekend" was the friends' idea, and he refused it
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'understand', seg: [33, 44],
      stem: 'In Ross’s “that’s okay” speech, what is he trying not to say?',
      choices: ['“One of you, please stay here with me.”', '“I’m hurt that none of you invited me.”',
                '“Go skiing, but do darts next weekend.”'], a: 0,
      cue: '彼が自分をどう描くかと、すぐ返ってくる申し出。',
      line: 'if you guys all have to go away… *I’m alone by myself*… — You know what? *I can stay*.',
      said: '「行くならいいよ、ひとりになるけど」と言うと、すぐに「私、残るよ」と返ってくる。',
      mean: '頼まずに寂しさだけを見せると、相手に「残る」と言わせる形になる。返事が、隠した頼みを言い当てている。',
      trap: '誘われなかった不満にも聞こえるが、行きたいとは言わない。隠した頼みは、相手の返事から逆に読む。',
      use: 'No, it’s fine. I’ll just eat alone.（ううん、いいの。ひとりで食べるから）' },

    // R fix: V2/K3: "quietly backs out" was refuted by "But you know what? I'll stay", and the key was the only
    //   coherent choice. The new distractor reads the "No, I'll stay" turns as a squabble over a chore.
    // why: argue over who has to ← "No, I'll stay… But I'll stay" heard as pushing a burden around (they want to);
    //   Ross says yes then changes ← he does flip, but he never says yes to an offer
    { id: 'g2', skill: 'gist', level: 'B2', point: 'offers', reveals: ['drive', 'pity'], seg: [33, 79],
      stem: 'Across the offers to stay, what keeps happening?',
      choices: ['Each offer meets a reason it won’t work', 'The friends argue over who has to stay',
                'Ross says yes, then changes his mind'], a: 0,
      cue: '申し出のたびに、すぐ返ってくる一言。',
      said: '一人は運転役で必要だと言われ、もう一人は「同情」と言われ、最後は本人が全部断る。',
      mean: '申し出は何度も出るが、毎回すぐ理由が付いて消える。そこが笑い。',
      trap: '最後の Nobody stays だけで「誰も申し出ない」と取りやすい。途中の返しを順に追う。',
      use: 'Every time I offer, there’s a reason.（申し出るたびに理由がある）' },

    // R fix: N7: the line holds x1's answer "kind of need", so it now reveals `kindof`.
    // why: Rachel ← her name is the last one heard before the offer; Monica ← she does offer to stay, but later
    // retired: the ear-check policy: the key needs “Phoebs” (whisper), the captions have “thieves” (50.7 s); back if
    //   the ear says Phoebs
    { id: 'w1', skill: 'who', level: 'B2', point: 'first', reveals: ['drive', 'kindof'], seg: [41, 55], retired: true,
      stem: 'Who is the first to offer to stay with Ross?',
      choices: ['Phoebe', 'Rachel', 'Monica'], a: 0,
      cue: '申し出のあと、誰が名前で呼ばれるか。',
      line: 'I can stay. … — *Phoebs*, we kind of need you to drive…',
      said: '「私、残れるよ」のあと、「フィービー、運転してもらわないと」と呼びかけられる。',
      mean: 'Phoebs はフィービーの愛称。申し出た人に向かって、名前で答えている。',
      trap: '直前に聞こえた名前で選びやすい。誰かを特定するときは、次の返事の呼びかけを聞く。',
      use: 'Thanks, Jen, but we’ve got it covered.（ありがとうジェン、でも大丈夫）' },

    // R fix: N7: the line holds x1's answer, so it reveals `kindof`; x1's stem, which gave this key away blind, now
    //   reveals `drive`.
    // why: lend the cabin ← "grandmother's" heard with the cabin from earlier; teach skiing ← she has just talked about
    //   skiing, so a ski job sounds likely
    { id: 'd4', skill: 'detail', level: 'B1', point: 'drive', reveals: ['first', 'kindof'], seg: [50.2, 55],
      stem: 'Why do the others need Phoebe on the trip?',
      choices: ['To drive everybody up there', 'To lend them her grandmother’s cabin', 'To teach the others to ski'],
      a: 0,
      cue: 'we kind of need you to のあとの動詞。',
      line: 'we kind of need you to *drive everybody up there*',
      said: '「みんなを車で連れて行ってもらわないと困る」と言う。',
      mean: 'drive ~ up there ＝ 向こうまで車で送る。運転手が必要。',
      trap: 'grandmother’s が聞こえると小屋の話と混ざる。need you to のあとの動詞が答え。',
      use: 'Could you drive us up there?（向こうまで車で送ってくれる？）' },

    // R fix: N7/B1: the stem says "Phoebs" (w1's key) and "drive everybody up there" (d4's key); it reveals both.
    { id: 'x1', skill: 'dict', level: 'B2', point: 'kindof', reveals: ['first', 'drive'], seg: [50.2, 55],
      stem: 'Type the words: “Phoebs, we ___ you to drive everybody up there.” (3 words)', answer: 'kind of need',
      cue: '呼びかけの直後。小さく速い3語。',
      line: 'Phoebs, we *kind of need* you to drive everybody up there',
      said: '「フィービー、ちょっと運転してほしいんだよね」。',
      mean: 'kind of は「カインダ」とつながり、頼みを少し和らげる。need は強く残る。',
      trap: 'kind of が一語の「カインダ」に聞こえて飛ばしやすい。弱い音の後ろの強い語から逆にたどる。',
      use: 'I kind of need a ride.（ちょっと乗せてほしいんだけど）' },

    // R fix: V2/K3: "Ross asked her straight out" was refuted by the whole scene, and "skiing" in a choice gave g1's
    //   old key away. The distractors now read the "No" and the earlier chairlift excuse.
    // why: an excuse to skip the trip ← the previous offer came with a fear of the chairlift, so this one sounds like
    //   another dodge; outdo the first offer ← "No, I'll stay" heard as overruling the friend who offered first
    { id: 'i2', skill: 'infer', level: 'B2', point: 'brother', seg: [55.5, 60.5],
      stem: 'What does the reason after “No, I’ll stay” suggest about why she’d stay?',
      choices: ['She feels she owes it to him as family', 'She’s glad of an excuse to skip the trip',
                'She wants to outdo the friend who offered first'], a: 0,
      cue: 'I’ll stay のあとの短い理由。',
      line: 'No, I’ll stay. *He’s my brother*.',
      said: '「いいよ、私が残る。兄弟だもん」と理由を言う。',
      mean: '家族だから残るのが当然、という義務の理由。楽しみたいからではない。',
      trap: 'スキーを嫌がる理由はこの前の人の話。この人の理由は、すぐ後ろの一言だけ。',
      use: 'I’ll go. She’s my sister.（私が行く。妹だもの）' },

    // R fix: V2/K3: "a short part of the weekend" was a filler, leaving the title's "pity" reading alone. Now guilt
    //   (the nearest other reason to stay) against pity.
    // why: out of guilt ← staying behind for a friend left out of the trip sounds like guilt, the nearest feeling to
    //   pity; a shame ← "a pity" learned as 残念 (It's a pity)
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'pity', seg: [55.5, 61],
      stem: 'When Ross answers her offer, what does his label for it mean?',
      choices: ['Staying because they feel sorry for him', 'Staying out of guilt for leaving him out',
                'Staying although it’s a shame to miss skiing'], a: 0,
      cue: 'He’s my brother の直後、短い聞き返し。',
      line: 'What, a *pity stay*?',
      said: '「何、同情で残るってこと？」と聞き返す。',
      mean: 'pity ＋ 名詞 ＝ かわいそうだから、の~。好意でなく同情だと受け取っている。',
      trap: 'It’s a pity（惜しい）を思い出しやすい。名詞の前の pity は「同情の」。',
      use: 'I don’t want a pity invite.（同情で誘われたくない）' },

    // R fix: V2: the key was the only choice not about food, and "her" named a speaker the audio doesn't settle.
    // why: a sad thing to eat ← "pity food" heard as comfort food, a comment on fudge itself; mishears ← "fudge" and
    //   "food" sound close
    { id: 'h1', skill: 'humor', level: 'C1', point: 'fudge', reveals: ['pity'], seg: [61.5, 70.6],
      stem: 'Why does Ross’s two-word answer to the fudge plan get a laugh?',
      choices: ['He tags even the fun plan as pity', 'He thinks fudge is a sad thing to eat',
                'He mishears “fudge” as another food'], a: 0,
      cue: '前の聞き返しと、同じ形の一言。',
      line: 'We’re gonna have fun. We can make *fudge*. — *Pity food?*',
      said: '「楽しくやろうよ、ファッジ作ろう」に、「同情の食べ物？」と返す。',
      mean: 'pity stay と同じ型で、楽しい提案まで同情扱いにする。くり返しが笑い。',
      trap: 'food を文字通りに取ると食べ物の注文に聞こえる。直前と同じ形の返しは、くり返しの笑い。',
      use: 'Is this a pity lunch?（これって同情ランチ？）' },

    // R fix: V2: the key echoed the title's "pity", and both distractors were contented moods. Now a selfless reading
    //   (遠慮) sits beside the proud one.
    // why: guilty, wants them to enjoy it ← the Japanese frame: "I don't need any of you to stay" heard as 遠慮; fed up ←
    //   "Nobody stays" heard as wanting to be left alone
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'nobody', seg: [68.5, 76],
      stem: 'When Ross tells everyone not to stay, how does he feel?',
      choices: ['Hurt, and too proud to accept help', 'Guilty, and wanting them to enjoy the trip',
                'Fed up, and wanting some time alone'], a: 0,
      cue: 'Pity food? のあと、okay を何度言うか。',
      line: 'I don’t need any of you to stay, okay? *Nobody stays*.',
      said: '「誰も残らなくていい、いい？誰も残るな」と言い切る。',
      mean: '同情されるくらいなら一人でいい、というプライド。okay の連発は強がり。',
      trap: '遠慮にも聞こえるが、直前は Pity food?。okay? の念押しは、気持ちが揺れている印。',
      use: 'I’m fine, okay? Really.（大丈夫だってば、ほんとに）' },

    // R fix: V2: the key was the only clever, specific choice. All three are now "a move, now that…" or its like.
    // why: goodbye ← "Nobody stays" sounds like it settles things, so the trip can start; apology ← the usual move
    //   when a friend is upset
    { id: 'pd1', skill: 'predict', level: 'C1', point: 'offer', seg: [70.5, 75.8], then: [75.8, 80],
      stem: 'Right after “Nobody stays,” what kind of line comes next?',
      choices: ['One more offer, now that he’s said no', 'A quick goodbye, now that it’s settled',
                'An apology for leaving him on his own'], a: 0,
      cue: '「誰も残るな」と言われたあと、一番安全な一言は？',
      line: 'Nobody stays. — *Well, then, I might as well offer to stay*.',
      said: '「誰も残るな」のあと、「じゃあ、残るって言っとこうかな」と続く。',
      mean: '断られると分かった今なら、申し出ても何も失わない。ずるい優しさの笑い。',
      trap: '友だちが落ち込んだら謝る、という型で考えやすい。直前の言葉が何を安全にしたかを考える。',
      use: 'Well, then I might as well ask.（じゃあ、聞くだけ聞いてみよう）' },

    // R fix: S2/§9.2: the stem quoted "might as well", the phrase whose meaning is the key (blind 75 %).
    // anchor: 74.4–78.0 s "Nobody stays." → "Well, then" (ties the offer to the refusal) → "might as well" (nothing to
    //   lose): the offer comes only once it can't be taken up
    // why: defy Ross ← sincerity flip: read like the earlier "No, I'll stay", loyalty pushing past his no; the polite
    //   last option ← the Japanese frame: 義理, someone has to offer before leaving
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'offer', seg: [70.5, 79],
      stem: 'What does the wording of the final offer to stay admit?',
      choices: ['It costs nothing, since it’ll be refused', 'It defies Ross, out of loyalty to him',
                'It’s the only polite thing left to do'], a: 0,
      cue: 'well, then が何につながっているか。',
      line: 'Nobody stays. — Well, then, I *might as well* offer to stay.',
      said: '「誰も残るな」に、「じゃあ、残るって言っとこうかな」と返す。',
      mean: 'might as well ＝ 損はないから。断られると決まった今だから言える、という本音をうっかり口にしている。',
      trap: '最後の申し出を義理や友情と取りやすい。well, then は直前の言葉を条件にする。何が条件かを聞く。',
      use: 'It’s free, so I might as well.（タダだし、せっかくだから）' },
  ]
};
