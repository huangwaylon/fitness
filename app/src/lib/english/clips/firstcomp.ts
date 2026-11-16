// “Pam Gets Her First Complaint - The Office US” (the official The Office channel, Best of Season 9): the office builds a
// tower of complaint cards; when the cards run out, Pam, teased as too nice to offend anyone, phones a client with a
// "your mama" joke, and the client is lost, to cheers.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings are whole-second blocks and repeat
// 86–103 s, so segments follow the captions. Talk ends at ≈ 184 s (whisper loops one invented line from 188 s). Pam is
// named in her own call ("This is Pam Halpert", 134 s, 148.8 s), Erin in hers (165 s); the tower's leader and the man
// coaching Pam are never named, so stems say "someone" and "a coworker". Untested on purpose: 0–24 s (Darryl's
// pocket-dial joke: sexual), 33 s (captions "take kevin breath", whisper "take a breath"), 80 s (captions "can you hear
// me cards", whisper "can you hand me a card"), 87.9 s (whisper "That's all cheating" only), 105–117 s (the "Pam" chant),
// 126.4 s (captions "you're scum pages", whisper "you're a scumbag, so you"), 151–154.6 s (captions "did you lie… was I
// hungry", whisper "did you buy it… were they angry"), 183.3 s (who says "No"). At 137.6 s the captions have "yes your
// paper provider", whisper "Yes, you're a paper provider": i2's key stands on either.
// EAR CHECK: 123.6 s nt2 — the stress in "I know you can fail" falls on "can" (ship only once confirmed)
// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 1 (unchanged)
//   Open: nt1's segment is 25 s, the same as the C2 talking-head limit, and over the 15 s most skills get. It
//   needs both "This is Pam Halpert"s and "confused, at least". Keep it, or cut it at 150 s (17.6 s) and drop the
//   reaction from the anchor?
import type { Clip } from '../types.ts';

export const firstComplaint: Clip = {
  id: 'firstcomp', video: '-555Hg5_Qqo', title: 'Pam Gets Her First Complaint', dur: 207, wpm: 162, band: 'mid',
  tags: ['職場', '電話'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %, right) + K1: "take their time, there's no rush" was close to the key. Now "breathe easy",
    //   which "Nobody even take a breath" refutes. S4: the segment stopped at "Nobody even" (31.68 s), before the words
    //   the trap cites. It now runs to 34.4 s.
    // why: this part is easy ← "easy" read as 簡単; breathe easy ← "easy" + "breath" put together, missing that the
    //   breath is to be held
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'easy', seg: [27.7, 34.4],
      stem: 'As the next card goes on, what does “Easy does it” ask everyone to do?',
      choices: ['Be very gentle and careful', 'Don’t worry, this part is easy', 'Take a break and breathe easy'],
      a: 0,
      cue: '直後の「nobody even」に続く頼み。',
      line: '*Easy does it*, everyone. Nobody even…',
      said: '塔にカードを乗せながら「そーっと、みんな。誰も…」と声をかける。',
      mean: 'Easy does it ＝「そっと、慎重に」。物を運ぶときや置くときの決まり文句。',
      trap: 'easy を「簡単」と取ると「楽勝」に聞こえる。息もするな、と続くので慎重さの話。',
      use: 'Easy does it. That box is heavy.（そーっとね。その箱重いから）' },

    // R fix: V2 (blind 60 %, right): only the key had a "when" add-on. All three are now one short act.
    // why: blaming ← "hey, hey, hey" heard as a sharp warning at someone; admitting ← "it's just a mistake" heard as "my
    //   mistake"
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'mistake', seg: [40.3, 46.4],
      stem: 'When someone breaks in with “Hey, hey, hey…”, what is he doing?',
      choices: ['Calming everyone back down', 'Telling off whoever did it', 'Owning up to his own slip'], a: 0,
      cue: '「hey」を3回のあと、同じ言葉を2回くり返す部分。',
      line: 'Hey, hey, hey, *it’s just a mistake*. It’s just a mistake.',
      said: '「まあまあ、ただのミスだよ。この塔はミスのためにあるんだ」と言う。',
      mean: 'just を付けて「大したことない」と落ち着かせている。誰かを責めてはいない。',
      trap: 'hey が続くと叱っているように聞こえやすい。just a mistake は慰めの決まり文句。',
      use: 'Hey, it’s okay. It happens.（まあまあ、大丈夫。よくあることだよ）' },

    // R fix: V2 + §9.4 (blind 85 %, right): the title says "complaint", so the only complaint choice won. All three now
    //   name a kind of record, and two say "complaint".
    // why: coworker ← "complaint" heard without "customer"; owned-up mistake ← "That's what this tower's all about.
    //   Mistakes." (44 s)
    { id: 'g1', skill: 'gist', level: 'B2', point: 'tower', seg: [40.3, 103.5],
      stem: 'What does each card on the office tower stand for?',
      choices: ['A complaint made by a customer', 'A complaint made by a coworker', 'A mistake someone owned up to'],
      a: 0,
      cue: '手を挙げる質問と、カードが空のあとの申し出。',
      said: '「苦情ゼロの人は？」と聞き、カード切れで Pam が「苦情を取る」と言う。',
      mean: '苦情1件がカード1枚。ミスを笑って受け入れるための塔。',
      trap: 'mistakes が何度も出るので「ミスの記録」と取りやすい。customer を聞く。',
      use: 'Everyone gets a complaint now and then.（苦情は誰でもたまにもらう）' },

    // R fix: V2 (blind 90 %, right): "working too slowly" was a filler. Now "being laughed at" (the tower as public
    //   shame). S3: the cue quoted "mistakes", the key's own word.
    // why: laughed at ← a tower of complaints read as a wall of shame; knocking it over ← "screw" + building, read
    //   literally, just after the tower fell
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'screwup', seg: [46.7, 50.45],
      stem: 'What does “afraid of screwing up” mean here?',
      choices: ['Afraid of making mistakes', 'Afraid of being laughed at', 'Afraid of knocking it over'], a: 0,
      cue: '直前に何度も出た語とのつながり。',
      line: 'if you’re afraid of *screwing up*, the tower’s not for you.',
      said: '「失敗が怖いなら、この塔は向いてない」と言う。',
      mean: 'screw up ＝ しくじる、ミスする。くだけた言い方。',
      trap: 'screw（ねじ）から組み立てや物を壊す話に取りやすい。直前の mistakes が手がかり。',
      use: 'Sorry, I screwed up the order.（ごめん、注文しくじった）' },

    // R fix: V2 (blind 60 %, right): "who has a spotless record" now reads as the literal search for that one person.
    // why: the one with none ← "show of hands" read as a real count; next card ← hands raised to volunteer
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'hands', seg: [50.1, 59.0],
      stem: 'What is the point of his “show of hands” question?',
      choices: ['To show nobody is free of complaints', 'To find the one person with none',
                'To pick who adds the next card'], a: 0,
      cue: '質問のすぐあと、自分で答えている部分。',
      line: 'Show of hands, who here has *never* had a complaint? That’s right. *Nobody.*',
      said: '「苦情を一度も受けたことがない人、手を挙げて。そう、誰もいない」と言う。',
      mean: '答えが分かっている質問で、「誰でもミスはする」と言いたい。',
      trap: 'show of hands を本当の調査と取りやすい。自分で Nobody と答えたら、主張のための質問。',
      use: 'Show of hands: who’s never been late?（遅刻したことない人、いる？）' },

    // R fix: V2 (blind 85 %, right): "taller than it ever was" is now "rising higher", which shares the phoenix's rise.
    // why: rising higher ← a phoenix "rises", and "pretty soon… the ceiling" comes next; scraps ← "ashes" read as
    //   leftover rubbish
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'phoenix', seg: [70.0, 74.9],
      stem: 'What does “like a phoenix from the ashes” say about the tower?',
      choices: ['It is back up after falling down', 'It is rising higher than before', 'It is built out of old scraps'],
      a: 0,
      cue: '「check it out」のあと、たとえの部分。',
      line: 'Check it out, huh? Like a *phoenix from the ashes*.',
      said: '積み直した塔を見せて「灰から生まれる不死鳥のようだ」と言う。',
      mean: '一度だめになったものが、よみがえること。少し前に塔は崩れていた。',
      trap: '直後に ceiling の話が来るので「高さ」に引かれやすい。不死鳥は「復活」のたとえ。',
      use: 'He came back like a phoenix.（彼は不死鳥のように復活した）' },

    // why: run out ← that is what happens next, but not what he says; fall again ← the earlier mistake
    { id: 'd3', skill: 'detail', level: 'B1', point: 'ceiling', seg: [75.8, 79.8],
      stem: 'What does someone say will happen pretty soon?',
      choices: ['They will run out of cards', 'The tower will reach the ceiling', 'The tower will fall down again'], a: 1,
      cue: '「pretty soon」のあと、文の最後の語。',
      line: 'Pretty soon, we’re gonna be at the *ceiling*.',
      said: '「もうすぐ天井まで届くぞ」と言う。',
      mean: 'be at the ceiling ＝ 天井に届く。塔がどんどん高くなっている。',
      trap: 'カードが切れるのはこのすぐあと。言ったこととこの後に起きることを分ける。',
      use: 'Pretty soon we’ll be out of milk.（もうすぐ牛乳がなくなるよ）' },

    // why: buy more ← the obvious fix, not said; take one off ← the tower itself as the source
    { id: 'd4', skill: 'detail', level: 'B1', point: 'blank', seg: [82.8, 89.4],
      stem: 'When the box turns out to be empty, what does someone suggest?',
      choices: ['Buying a new box of cards', 'Using a card with nothing on it', 'Taking a card off the tower'], a: 1,
      cue: '「come on, we could use」のあと。',
      line: 'It’s empty. — … Oh, come on, we could use a *blank card*.',
      said: '「空っぽだ」の声のあと、「白紙のカードでいいじゃん」と言い、「だめ」と返される。',
      mean: 'blank ＝ 何も書いていない。中身のない苦情カードでごまかす案。',
      trap: '新しく買うのが普通の解決だが、言っていない。blank の「白紙」を聞き取る。',
      use: 'Do you have a blank form?（白紙の用紙ありますか）' },

    // R fix: V2 (blind 75 %, right): "scared of bugs and dirt" was absurd. Now "too honest to fake a complaint", which
    //   the blank-card "cheating" just before invites.
    // why: too honest ← the blank card was just ruled out as cheating; never caught ← "Miss Priss" heard as careful,
    //   not as prim
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'butterfly', seg: [89.4, 96.1],
      stem: 'When Pam offers to get a complaint, what does the coworker’s reply mean?',
      choices: ['You’re too proper to be rude to anyone', 'You’re far too honest to fake a complaint', 'You’re too careful to ever get caught'],
      a: 0,
      cue: '「You?」のあと、彼女を何と呼ぶか。',
      line: 'You? *Little Miss Priss*? You *wouldn’t fart on a butterfly*.',
      said: '「君が？お上品なお嬢さんが？チョウにおならもかけないくせに」と言う。',
      mean: 'Miss Priss ＝ お上品ぶった人。誰にも失礼なことができない、というからかい。',
      trap: '「ずる」の直後なので「正直すぎる」と取りやすい。Priss は上品さの話。',
      use: 'She wouldn’t hurt a fly.（あの人は虫も殺さない）' },

    // R fix: V2 (blind 50 %, right): the thank-you was a weak reading. It now thanks him for calling her nice.
    // why: thanks ← the jab heard as praise of her niceness (the お礼 frame); "No, I wouldn't…" ← her real, literal answer,
    //   which takes the picture at face value
    // anchor: 92.2–95.9 s "You? Little Miss Priss?": the doubt is about whether she can be rude, so a fitting reply
    //   answers the doubt, not the butterfly
    { id: 'nt3', skill: 'pragma', level: 'C2', point: 'butterfly', seg: [89.4, 96.1],
      stem: 'Which reply from Pam would match what the coworker meant?',
      choices: ['Hey, I can be mean when I want!', 'No, I wouldn’t. I like butterflies.', 'Aw, thanks. I do try to be nice.'],
      a: 0,
      cue: '「You?」の疑う調子と、言いたいことの中身。',
      line: 'You? *Little Miss Priss*? You wouldn’t fart on a butterfly.',
      said: '苦情を取ってくると言う Pam に、「君が？お上品な君が？」とからかう。',
      mean: '言いたいのは「君に失礼なことは無理」。合う返事は「やればできる」と言い返すもの。チョウの話ではない。',
      trap: '実際の Pam はチョウの話に文字通り答え、そこが笑い。返事は言葉の形でなく、相手の言いたいことに返す。',
      use: 'Oh, I can be tough. Watch me.（私だって強気になれるよ。見てて）' },

    // R fix: V2 (blind 55 %, right): "teases him right back" was the script nobody breaks. Now "takes it as praise".
    // why: admits ← "wouldn't" heard as "would" (final -n't lost); praise ← "Little Miss Priss" heard as a compliment
    { id: 'h1', skill: 'humor', level: 'C1', point: 'relate', reveals: ['butterfly', 'canfail'], seg: [92.0, 99.6],
      stem: 'Why does Pam’s first answer to the teasing get a laugh?',
      choices: ['She treats the joke as a serious question', 'She admits she has done it once or twice',
                'She takes it as praise and thanks him for it'], a: 0,
      cue: '「No」のあと、「relate」までの答え方。',
      line: 'No, I wouldn’t. I *can’t even relate to that impulse*.',
      said: '「ええ、しないわ。そんな衝動、理解もできない」と大まじめに答える。',
      mean: 'からかいのたとえに、本気の質問のように答えている。そのまじめさが笑い。',
      trap: 'wouldn’t の t は消えやすく、would に聞こえると逆の意味になる。no と合わせて判断。',
      use: 'I can’t even relate to that.（その気持ち、全然わからない）' },

    // R fix: V2 (blind 65 %, right): "annoyed" was easy to cut. All three are now "X, but/and Y" states.
    // why: not keen ← "I'd like to try" heard as a polite hedge (遠慮); hurt ← the teasing just before
    { id: 't1', skill: 'attitude', level: 'B1', point: 'try', reveals: ['getus'], seg: [96.0, 103.5],
      stem: 'After the teasing, how does Pam sound about getting a complaint?',
      choices: ['Sure of herself, and eager to try', 'Polite, but not really that keen', 'Hurt, but doing her best to hide it'],
      a: 0,
      cue: '「but」のあとの2つの短い文。',
      line: 'But *I bet I could* get us a customer complaint. *I’d like to try.*',
      said: '「でも、きっと苦情を取れる。やってみたい」と言う。',
      mean: 'I bet I could ＝ きっとできる。自分から名乗り出ている。',
      trap: 'I’d like to は遠慮に聞こえやすいが、ここは前向きな申し出。I bet で自信が分かる。',
      use: 'Let me try. I bet I can.（やらせて。たぶんできる）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'getus', seg: [99.4, 101.95],
      stem: 'Type what she says: “I bet I could ___ customer complaint.” (3 words)', answer: 'get us a',
      cue: '「could」のすぐあと、短い3語。',
      line: 'But I bet I could *get us a* customer complaint.',
      said: '「きっと、みんなのために苦情を取ってこられる」と言う。',
      mean: 'get us a が「ゲラサ」とつながる。t が弾み、us と a は弱い。',
      trap: 'つながって1語に聞こえやすい。get＋人＋物（人に物を取ってくる）の形を思い出す。',
      use: 'Can you get us a table for four?（4人の席をお願いできますか）' },

    // R fix: V2 (blind 60 %, right): "brand-new" was no near sound. Now "fairly new" ("fam-" vs "fair-"). i1's choices no
    //   longer say "family", which leaked the key.
    // why: fairly new ← "family" heard as "fairly"; biggest ← "don't let that take away" read as high stakes
    { id: 'd1', skill: 'detail', level: 'B1', point: 'family', seg: [116.8, 122.6],
      stem: 'What does the coworker tell Pam about the client company?',
      choices: ['It is a fairly new company', 'It is a family-owned business', 'It is their biggest client'], a: 1,
      cue: '会社名のすぐあと、「they’re」に続く部分。',
      line: 'The client is Haymont… *They’re family owned*, but…',
      said: '電話の相手の会社名を言い、「家族経営だけど」と付け足す。',
      mean: 'family owned ＝ 家族経営。このあと but で注意が続く。',
      trap: '会社名のあとに続くので「新しい」「大きい」と想像しやすい。owned を聞き取る。',
      use: 'It’s a family-owned restaurant.（家族経営のレストランです）' },

    // R fix: V2 (blind 55 %, right): "a small firm won't care" was weak. Now "losing her nerve with a big client". The
    //   choices no longer say "family", so they don't hand d1 its key.
    // why: private matters ← "family" + "don't let" heard as a topic to avoid; nerve ← "edge" heard, but the reason
    //   moved onto the client's size
    { id: 'i1', skill: 'infer', level: 'C1', point: 'edge', reveals: ['family'], seg: [116.8, 122.6],
      stem: 'What is the coworker warning Pam against?',
      choices: ['Going soft on them because they seem nice', 'Bringing up private matters on the call',
                'Losing her nerve with such a big client'], a: 0,
      cue: '「but don’t let that」のあと。',
      line: 'They’re family owned, but *don’t let that take away your edge*.',
      said: '「家族経営だけど、それで手をゆるめるな」と言う。',
      mean: 'edge ＝ 鋭さ、強気。家族経営と聞くと優しくしたくなる、それを止めている。',
      trap: 'family と don’t が近いので「家族の話はするな」に取りやすい。that は「家族経営だということ」。',
      use: 'Don’t let that scare you off.（そんなことで引かないで）' },

    // R fix: V2 (blind 50 %, right): the key was the only upbeat choice. All three are now outcomes for the game, and the
    //   complaint going on file is a near miss.
    // why: laughs it off ← the "your mama" joke heard as harmless; complaint but kept ← "make sure that goes on file"
    //   heard as the whole result
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['lost', 'file'], seg: [116.8, 183.8],
      stem: 'How does Pam’s attempt turn out in the end?',
      choices: ['The client laughs it off, so no complaint', 'They lose the client, and they cheer',
                'They get the complaint but keep the client'], a: 1,
      cue: '最後の発表と、そのあとの歓声。',
      said: 'Pam の電話のあと、Erin が電話を受け、「顧客をひとつ失った」と発表されて歓声が上がる。',
      mean: '苦情どころか顧客が離れた。この遊びでは大成功という結末。',
      trap: 'Erin が苦情を記録するので「苦情だけで済んだ」と取りやすい。最後の発表で結果が分かる。',
      use: 'It worked better than we expected.（思った以上にうまくいった）' },

    // why: can't ← the pep-talk "you can't fail" is what learners expect, and can't's t is barely heard; won't / could ←
    //   other short words in that slot
    { id: 's1', skill: 'sound', level: 'B2', point: 'canfail', seg: [122.6, 126.3],
      stem: 'Fill the gap: “Come on, I know you ___ fail.”',
      choices: ['can', 'can’t', 'won’t', 'could'], a: 0,
      cue: '「I know you」のあと、短い一語の母音。',
      line: 'I know you *can* fail. I see failure in you.',
      said: '「君なら失敗できる。君の中に失敗が見える」と励ます。',
      mean: 'can が強く「キャン」。次の文の failure で、逆さの励ましだと分かる。',
      trap: '励ましなら can’t fail と思いこみやすい。can’t の t は消えるので、続く文で決める。',
      use: 'I know you can do it.（君ならできるよ）' },

    // R fix: V2 (blind 80 %, right): the key was the only one with a mechanism. All three now say what the talk is.
    // why: mean jab ← "I see failure in you" read as a real criticism; slip ← "fail" heard as a wrong word for "win"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'canfail', seg: [122.6, 126.3],
      stem: 'What makes the coworker’s pep talk to Pam funny?',
      choices: ['A real pep talk, with failing as the goal', 'A mean jab, dressed up as a pep talk',
                'A slip: he means “win” but says “fail”'], a: 0,
      cue: '2つの文で、何を「できる」「見える」と言っているか。',
      line: 'I know you can *fail*. I see *failure* in you.',
      said: '「君なら失敗できる。君の中に失敗が見える」と言う。',
      mean: '「君ならできる」の励まし方そのままで、目標を「失敗」にしている。',
      trap: '本気の批判に聞こえやすいが、ここでは失敗＝苦情が目標。言いそこないなら2回は続かない。',
      use: 'You’ve got this. I believe in you.（いける。信じてるよ）' },

    // R fix: V2 (blind 55 %, right): "on know" was weak. Now "on you", a real contrast reading (Pam against the rest).
    // why: on "fail" ← the last word of a sentence usually carries the stress; on "you" ← Pam picked out from the room
    // anchor: 122.7–125.8 s "I know you can fail. I see failure in you.": the second sentence makes failing the target,
    //   so the contrast is with the usual "you can't fail"
    // retired: the ear-check policy: a C2 stress item (the stress on “can” in “I know you can fail”, 123.6 s); back after
    //   the ear check
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'canfail', seg: [122.6, 126.3], retired: true,
      stem: 'Where is the stress in “I know you can fail”, and why?',
      choices: ['On “can”: it flips the usual “you can’t fail”', 'On “fail”: it names the task like any goal',
                'On “you”: it singles Pam out from the rest'], a: 0,
      cue: '短い一文で、いちばん強く長く聞こえる語。',
      line: 'I know you *can* fail. I see failure in you.',
      said: '苦情を取りに行く Pam に「君なら失敗できる。君の中に失敗が見える」と言う。',
      mean: 'can を強めると「できない、ではなくできる」という対比。お決まりの「君は失敗しない」をひっくり返す。',
      trap: '文末の語が強いと思いがちだが、対比があると強勢はそこへ移る。何と比べているかで強勢の位置が決まる。',
      use: 'I’m not tired. I AM hungry, though.（疲れてはない。おなかは空いてるけど）' },

    // R fix: V2 (blind 60 %, right): all three are now reactions to her name and company, not one reaction against two
    //   plans.
    // why: an order ← a paper company calling = an order call; wrong number ← the extra explanation heard as a
    //   correction
    { id: 'i2', skill: 'infer', level: 'B2', point: 'provider', seg: [132.2, 139.1],
      stem: 'What does Pam’s “Yes, your paper provider” suggest about the person on the phone?',
      choices: ['They needed a moment to place the company', 'They were expecting a call about an order',
                'They thought she had dialed the wrong number'], a: 0,
      cue: '会社名を言ったあと、相手が何と言ったか想像して。',
      line: 'I’m calling from Dunder Mifflin. — *Yes, your paper provider.*',
      said: '名乗ったあと、「ええ、御社の紙の取引先です」と言い足す。',
      mean: '相手が「どちらの？」と聞き返したので、説明を足している。相手の声は聞こえない。',
      trap: 'Yes は相手の質問への返事。電話は片方だけでも、返事の形から相手の言葉が分かる。',
      use: 'Yes, from the hotel. About your booking.（はい、ホテルです。ご予約の件で）' },

    // why: the client's mother ← the target of the words; her coworkers ← they pushed her into it (right mechanism,
    //   wrong target)
    // R fix: K1 + V2 (blind 75 %, right): "comes out mild" clashed with the lost client (175 s). The key is now about
    //   how she is rude, and the coworkers' distractor is as specific as the key. S4: trimmed to 25 s.
    // anchor: 132.7–149.3 s she opens with her full name and company, tells a schoolyard "your mama" joke, then signs off
    //   with her name again; 155.5–157.2 s "I felt like they were confused, at least": she is rude only in the politest,
    //   most childish way
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'call', seg: [132.4, 157.4],
      stem: 'In Pam’s phone call, who is the joke really on?',
      choices: ['Pam, who is rude in the politest way', 'The client’s mother, the target of the joke',
                'Her coworkers, who cheer on a childish stunt'], a: 0,
      cue: '電話の最初と最後に言うこと、そのあとの感想。',
      line: 'Hello, *this is Pam Halpert*… your mama is so fat… *This is Pam Halpert.* … they were *confused, at least*.',
      said: '丁寧に名乗って子どもっぽい悪口を言い、最後にまた名乗る。あとで「戸惑ってたかも」と言う。',
      mean: '失礼な電話のはずが、丁寧な名乗りに挟まれた子どもっぽい悪口。笑われるのは悪者になりきれない本人。',
      trap: '悪口の中身から母親が的に見えるが、それは型どおりの冗談。名乗り方と結果の感想で誰の話か決まる。',
      use: 'I tried to sound tough. It didn’t work.（強気に言おうとしたけど無理だった）' },

    // R fix: K6 + V2 (blind 55 %, right): the key was the only hedged choice. All three are hedged now.
    // why: fears they were hurt ← Pam's niceness read into "confused"; took it as a joke ← a joke call heard as landing
    //   as one
    { id: 't2', skill: 'attitude', level: 'B2', point: 'confused', reveals: ['call'], seg: [150.6, 157.9],
      stem: 'How does Pam feel about how the call went?',
      choices: ['Not sure, but she hopes it worked', 'Not sure, but she fears they were hurt', 'Fairly sure they took it as a joke'],
      a: 0,
      cue: '「felt like」のあと、文の終わりの2語。',
      line: 'I felt like they were *confused, at least*.',
      said: '「少なくとも、戸惑ってはいたと思う」と答える。',
      mean: 'at least ＝「せめて」。成功か分からないが、少し手ごたえがある。',
      trap: 'Pam は優しいので「傷つけたか心配」と取りやすい。at least ＝「せめて」は控えめな期待の合図。',
      use: 'Well, at least we tried.（まあ、少なくともやってはみたね）' },

    // why: call back ← the usual office promise; pass to Pam ← Pam is the reason for the call
    { id: 'd2', skill: 'detail', level: 'B2', point: 'file', reveals: ['call', 'canfail'], seg: [163.9, 172.4],
      stem: 'What does Erin promise the caller?',
      choices: ['To pass their message on to Pam', 'To have someone call them back', 'To put what they said on record'],
      a: 2,
      cue: '「make sure」のあと、文の最後の語。',
      line: 'Yes, you can. … I will make sure that *goes on file*.',
      said: '会社の電話に出て、「はい、できます」「記録に残しておきます」と答える。',
      mean: 'go on file ＝ 記録に残る。苦情を正式に受け付けた、ということ。',
      trap: '電話応対なら「折り返し」が定番だが、言っていない。file（ファイル）は記録のこと。',
      use: 'I’ll make sure it goes on file.（記録に残しておきますね）' },

    // R fix: V2 (blind 65 %, right): "a chance to win them back" didn't fit the cheering. Now "less work", the cynical
    //   office script.
    // why: tough client ← the usual "good riddance" script, and "See you later, Haymont"; less work ← the office-cynic
    //   reading of a lost client
    { id: 'i3', skill: 'infer', level: 'C1', point: 'lost', reveals: ['call', 'file'], seg: [168.3, 181.2],
      stem: 'Why is the news at the end treated as good news?',
      choices: ['Losing a client tops any complaint', 'They never liked that client anyway',
                'Losing a client means less work'], a: 0,
      cue: '「ladies and gentlemen」のあと、何を失ったか。',
      line: 'Ladies and gentlemen, *we just lost a client*!',
      said: '「みなさん、顧客をひとつ失いました！」と発表し、みんなが歓声を上げる。',
      mean: '苦情を集める遊びでは、顧客を失うのは苦情以上の「大成功」。普通なら大問題。',
      trap: '「どうせ面倒な客だった」は定番の言い方だが、言っていない。塔のルールで考える。',
      use: 'Ladies and gentlemen, we did it!（みなさん、やりました！）' },
  ]
};
