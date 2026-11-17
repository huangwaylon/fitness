// REVIEW 2026-11-17: pass 5, fix 18, drop 1, new 0; ear checks 2
// Open: a cold re-read of the new choices put f1, i1 and g1 at 45–50 % and g3 at 55 % (the title says "a great
//   one"); the audio settles each. s2 is a C2 stress item: the app ships it retired until the ear check.
// “Is Sam Puckett a Terrible Friend? 🧈🧦 (Or a Great One 👀) | iCarly” (NickRewind, Best of iCarly 📲): a narrator
// weighs Sam as a friend over short cuts: loyal (pushing Carly toward Jake, threatening a girl), aggressive, teasing
// Freddie, silly in skits, then selfish: she trades the T-shirt Carly made her for concert tickets, they fight, she
// goes without Carly, and after more fighting they make up. The narrator ends on "a great friend to have".
// Segments from the captions, words from whisper (2026-11-17). Sam is named by the narrator and in the audio
// ("Sam?", "Oh man, Sam"), Carly by the narrator and "Carly did it!"; the other voices aren't named, so items say
// "the other girl" or "her friend".
// Untested on purpose: 31–37 s ("bake/make cookies on him", the sources differ), 100–110 s (whisper "Do that again!"
// vs captions "never do that again"; the microphone gag is visual), 126 s ("For what?" / "For once"), 134–153 s (the
// "I wasn't ripping on a guy" and "Someone finally friended you?" lines are put-downs, and captions write "tripping"),
// 167–190 s (the skit repeats, captions garble it; "I'll dive/down the lobby"), 194–199 s (who asks for the
// sandwich isn't said), 216–218 s and 266–268 s ("gift-giver-a-wear/aware/awayer", the sources differ), 224 s ("ham"
// / "hate"), 233–235 s (the sources differ), 295–313 s (the snacks are on screen), 334–348 s (visual).
// EAR CHECK: 41.9 s s1 — “can't” is said with the long “æ” and an unreleased t (both sources have “can't”)
// EAR CHECK: 286.1/288.3 s s2 (C2 stress, ships retired) — “I loves me the cold chili”: are the -s and “me” there?
//   And when: whisper has 286.1 s, the captions 288.3 s (the segment holds both)
import type { Clip } from '../types.ts';

export const samFriend: Clip = {
  id: 'samfriend', video: 'y_0dqzVj-Vs', title: 'Is Sam Puckett a Terrible Friend? 🧈🧦 (Or a Great One 👀)',
  dur: 348, wpm: 153, band: 'mid', tags: ['友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %, the key was the only one about her manners): both distractors now share its "Her … can be
    //   a little …" shape
    // why: loyalty wears thin ← the "But" after "will always have your back" heard as taking the loyalty back; a hard
    //   life ← "rough" in its everyday "a rough time" sense
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'edges', seg: [2.98, 6.5],
      stem: 'Right after the opening promise, what does the narrator admit about Sam?',
      choices: ['Her manners can be a little crude', 'Her loyalty can wear a little thin',
                'Her life can be a little hard at times'], a: 0,
      cue: '「but」のあと、rough に続く三語。',
      line: 'But sometimes, she can be a little *rough around the edges*.',
      said: '「でも時々、ちょっと荒っぽい」と言う。',
      mean: 'rough around the edges ＝ 粗削り。根はいいが、態度が雑なこと。',
      trap: 'rough だけだと「つらい」に寄り、苦労話に聞こえる。around the edges まで一つの表現。',
      use: 'He’s a bit rough around the edges.（ちょっと粗削りな人だよ）' },

    // R fix: V2 (blind 65 %, the key was the only twisted reason): all three are now "her proof of friendship", wrong
    //   in one way each
    // why: hits for her ← "have your back" just before, read as a bodyguard's promise, though the one punched is "you";
    //   has hit her ← "would punch" heard as a past punch they got over
    { id: 'h1', skill: 'humor', level: 'C1', point: 'punch', seg: [10.86, 16.6],
      stem: 'Why does the first “best friend” reason in the clip get a laugh?',
      choices: ['Her proof of friendship is that she doesn’t hit her', 'Her proof of friendship is that she’d hit for her',
                'Her proof of friendship is that she’s hit her before'], a: 0,
      cue: '「anybody but」のあとの一語と、殴られるのは誰か。',
      line: 'anybody *but me* would punch you right in the head. Which is *why you are my best friend*.',
      said: '「私以外ならみんな殴ってる。だから親友」と言う。',
      mean: 'anybody but me ＝ 私以外の誰でも。殴らずにいてあげるのが友情、という逆さの理屈。',
      trap: 'have your back の直後なので「守るために殴る」と取りやすい。殴られるのは you。',
      use: 'Anybody but me would’ve said no.（私以外なら断ってたよ）' },

    // anchor: 13.68–15.6 s "Which is why you are my best friend", then 17.6–19.12 s "Good to know. Now why are you
    //   mine?": she plays along and sends the same jab back in the same form
    // R fix: V2/K6 (blind 60 %, the key was the only warm choice): the one-sided reading became a warm near miss
    // why: sincere thanks ← "Good to know" taken at face value (それは良かった), the jab after it missed; real doubt ←
    //   "why are you mine?" taken as a sincere question (the sincerity flip)
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'mine', reveals: ['punch'], seg: [10.86, 19.55],
      stem: 'What does this exchange show about how the two friends see each other?',
      choices: ['They tease each other and are still close', 'They’re close, and the reply is a sincere thanks',
                'One of them doubts that they’re best friends'], a: 0,
      cue: '返事の最初の三語と、同じ形で返す問い。',
      line: 'Which is why you are my best friend. — *Good to know. Now why are you mine?*',
      said: '「だから親友なの」に「それはどうも。で、あんたはなぜ私の親友？」と返す。',
      mean: '同じ形の問い返しは、からかいへのからかい返し。言い合える近さがあってこその冗談。',
      trap: 'why are you mine を本気の疑いと取りやすい。Good to know で軽く受けたあとの問いは遊び。',
      use: 'Good to know. Now, your turn.（それはどうも。で、そっちは？）' },

    // R fix: V2 (blind 55 %): "the final say" became a screener near miss; V5: a common slang word, so B2
    // why: keeps boys away ← "loyalty runs deep" and Sam's tough side, read as a guard; checks them out ← "wingman" read
    //   as a friend who screens boys first
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'wingman', seg: [23.4, 27.9],
      stem: 'When the narrator turns to boys, what role does Sam play for Carly?',
      choices: ['She helps Carly get a boy she likes', 'She keeps boys from getting near Carly',
                'She checks out boys before Carly dates them'], a: 0,
      cue: '「ultimate」のあとの一語と、続く場面。',
      line: 'Sam is the *ultimate wingman* for Carly.',
      said: '「男の子のことなら、サムはカーリーの最高の応援役」と言う。',
      mean: 'wingman ＝ 恋の相手に近づけるよう手助けする友だち。直後の場面でも後押しする。',
      trap: 'wingman を見張り役と取りやすい。直後の場面では、話しかけるよう背中を押している。',
      use: 'Can you be my wingman tonight?（今夜、応援役をお願いできる？）' },

    // R fix: V2 (blind 55 %): "What?" taken out of the stem, as it signalled a protest
    // why: can ← the t of "can't" isn't released, so only "can" seems left; could ← the same k sound, the vowel missed
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [40.8, 43.72],
      stem: 'Fill the gap: “You ___ just say hi to a guy like Jake…”',
      choices: ['can’t', 'can', 'could'], a: 0,
      cue: 'You のあと、短い語の母音の長さ。',
      line: 'What? You *can’t* just say hi to a guy like Jake Crandall.',
      said: '「え？ジェイク・クランドールみたいな人に、ただ挨拶なんてできない」と言う。',
      mean: 'can’t の t はほぼ聞こえない。母音が「キャーン」と長めで強いのが、否定のしるし。',
      trap: 'can は「クン」と弱く短い。t を探すより、母音が強く伸びるかで聞き分ける。',
      use: 'I can’t just leave without saying bye.（黙って帰るわけにいかない）' },

    // R fix: V2 (blind 60 %): "sure he'd ignore her" became the polarity near miss
    // why: won't say hi back ← "says hi back" heard with the polarity flipped, the usual "out of my league" script; excited ← "what do I say"
    //   heard as planning, though it's a question with no answer
    { id: 't1', skill: 'attitude', level: 'B2', point: 'hiback', seg: [40.8, 46.3],
      stem: 'When told to just go say hi, how does Carly react?',
      choices: ['Nervous about what comes after the hi', 'Nervous that Jake won’t say hi back',
                'Excited, already planning what to say'], a: 0,
      cue: '「What if」で始まる問いと、それに続く問い。',
      line: 'What if he *says hi back*? Then *what do I say*?',
      said: '「挨拶を返されたら？そしたら何て言えばいいの？」と聞き返す。',
      mean: 'what if 〜 ＝ もし〜したらどうしよう。無視より、話が続く方が怖い。',
      trap: 'a guy like Jake から「返してくれない」不安と取りやすい。怖いのは返されたあと。',
      use: 'What if it rains? Then what?（雨が降ったら？そしたらどうする？）' },

    // R fix: K6 (blind 50 %): the key was the only choice without "apple"
    // why: Carly throws ← "sorry I hit you" heard as Carly's own line to say, so Carly must have done it; an apple as
    //   a gift ← "apple" is said, and offering something is the friendly script
    { id: 'i1', skill: 'infer', level: 'C1', point: 'apple', seg: [46.2, 56.0],
      stem: 'What is Sam’s plan for giving Carly something to say to Jake?',
      choices: ['Throw an apple herself and blame Carly', 'Have Carly throw an apple at Jake',
                'Have Carly offer Jake an apple'], a: 0,
      cue: '「Ow」のあとの短い一言。誰のせいにしているか。',
      line: 'Just say, um, *sorry I hit you in the head with an apple*. … *Carly did it!*',
      said: '「リンゴを当ててごめん、と言えば」の直後に「痛っ」「カーリーがやった！」。',
      mean: 'サムが当てて、カーリーのせいにする。話しかける理由を作る作戦。',
      trap: 'sorry I hit you の I をカーリーと取りやすい。最後の一言で誰のせいかが分かる。',
      use: 'Just say sorry and start from there.（まず謝って、そこから話せばいい）' },

    // why: shocked ← her echo "Rip my head off?" heard as disbelief, before the next line; amused ← "I'd love to see"
    //   taken literally, as enjoying a show
    { id: 't2', skill: 'attitude', level: 'B2', point: 'try', seg: [62.1, 70.9],
      stem: 'When she hears “Rip her head off,” how does the other girl react?',
      choices: ['Unafraid: she dares Sam to go ahead', 'Shocked: she can’t believe the threat',
                'Amused: she’d enjoy watching a fight'], a: 0,
      cue: '聞き返しのあとに続く、love で始まる一言。',
      line: 'Rip my head off? *I’d love to see her try it.*',
      said: '「頭を引きちぎる？やれるものならやってみなさいよ」と返す。',
      mean: 'I’d love to see you try ＝ できるものならやってみろ。怖がらず挑発している。',
      trap: 'love を文字どおり取ると楽しんでいるように聞こえる。try で終われば挑発。',
      use: 'Beat me? I’d love to see you try.（私に勝つ？やってみなよ）' },

    // R fix: V2/K3 (blind 50 %): "the holder says sorry" was weak; now a turn-order near miss
    // why: her own aggression ← "for saying" lost, so it sounds like "sorry for being aggressive"; sorry unasked ←
    //   "Say you're sorry" overlaps "Let me go!", so the order is lost
    { id: 'h2', skill: 'humor', level: 'C1', point: 'sorry', seg: [81.7, 89.3],
      stem: 'After “Let me go!”, why does the apology get a laugh?',
      choices: ['The apology for “aggressive” is taken by force', 'She apologizes for being aggressive herself',
                'She says sorry before she’s even asked to'], a: 0,
      cue: '「what are you sorry for」への答えと、その場の様子。',
      line: 'And what are you sorry for? — *For saying you’re aggressive.*',
      said: 'つかまれて謝らされ、「何について？」に「乱暴だと言ったことを」と答える。',
      mean: '乱暴だと言ったことを、力ずくで謝らせる。そのやり方が言葉どおりで笑える。',
      trap: 'for saying を聞き落とすと、自分の乱暴さを謝ったように聞こえる。for の後まで聞く。',
      use: 'Sorry for saying that.（あんなこと言ってごめん）' },

    // why: Two ← "negative" missed, only the number kept; Seven and Nine ← the scores said just before, for the girl
    { id: 'n1', skill: 'number', level: 'B1', point: 'scores', seg: [119.65, 126.1],
      stem: 'In the scoring, what does Freddie get?',
      choices: ['Negative two', 'Two', 'Seven', 'Nine'], a: 0, keep: true,
      cue: '最後の採点、数の前の一語。',
      line: '… Seven. — But I give Freddie a *negative two*.',
      said: '女の子には8、9、7点が付き、最後に「でもフレディはマイナス2」と言う。',
      mean: 'negative ＝ マイナス。出場していないフレディにまで点を付けて、からかっている。',
      trap: '数字だけ追うと two しか残らない。数の直前の negative まで聞く。',
      use: 'I’d give it a nine out of ten.（10点中9点かな）' },

    // R drop: f3, the "they say" theory: the teasing-means-a-crush trope answers it (V1; blind 85 %). Never shipped.

    // why: loyalty ← "her loyalty runs deep" was the first reason; a sense of fun ← "super fun" is said, as the result
    { id: 'd1', skill: 'detail', level: 'B1', point: 'quality', seg: [154.1, 159.3],
      stem: 'What does the narrator call Sam’s greatest quality?',
      choices: ['Her confidence', 'Her loyalty', 'Her sense of fun'], a: 0,
      cue: '「greatest quality is」のあとの一語。',
      line: 'Sam’s greatest quality is *her confidence*, making her super fun…',
      said: '「サムの一番の長所は自信。だから一緒にいて楽しい」と言う。',
      mean: 'confidence ＝ 自信。楽しさは、その自信から来る結果。',
      trap: 'super fun も聞こえるが、making のあとは「その結果」。長所は is の直後。',
      use: 'Her greatest quality is her patience.（彼女の一番の長所は辛抱強さ）' },

    // anchor: 165.76–166.88 s both sources "I ain't gonna give you no soup" (whisper 165.86 s): the double negative
    //   is in the audio, not a mishearing
    // R fix: the answer in plain apostrophes, as the app's dict check expects
    // dict: the grammar-correcting instinct writes "am not going to give you any"
    { id: 'x1', skill: 'dict', level: 'C2', point: 'soup', seg: [163.58, 167.3],
      stem: 'Type the reply to “Just give me some soup!”: “I ___ soup!” (5 words)',
      answer: "ain't gonna give you no",
      cue: 'I のあと、否定が二回出てくる。',
      line: 'Just give me some soup! — I *ain’t gonna give you no* soup!',
      said: '「スープちょうだい！」に「スープなんかやらねえよ！」と、わざと乱暴に返すコント。',
      mean: 'ain’t ＋ no の二重否定は、わざと崩した口語。否定が重なっても「やらない」の強調。',
      trap: '文法どおり any に直すと、聞いた音と合わない。崩れた役の台詞は、崩れたまま書く。',
      use: 'I ain’t gonna lie, it was good.（正直、良かったよ）' },

    // R fix: V2 (blind 60 %): "forgot the anniversary" became "forgot the gift", a near miss on the same object; the
    //   line no longer quotes s1's "can't"
    // why: the concert ← "concert" comes up again and again, and Carly says she won't go; forgot the gift ←
    //   "anniversary" is said, the usual "you forgot" script
    { id: 'g1', skill: 'gist', level: 'B2', point: 'shirt', seg: [201.8, 237.4],
      stem: 'What is the fight between Sam and Carly really about?',
      choices: ['Sam gave away a gift Carly made her', 'Sam forgot the gift Carly made her',
                'Sam won’t take Carly to the concert'], a: 0,
      cue: '「I can’t believe you」のあとに何が続く？',
      line: '… you *just gave it away*.',
      said: '手作りTシャツをサムがチケットと交換し、カーリーが怒る。',
      mean: '怒りの中心は物より気持ち。手作りの贈り物を手放され、軽く扱われたと感じた。',
      trap: 'concert や anniversary が何度も聞こえる。怒りの言葉の直後に、怒る理由がある。',
      use: 'I can’t believe you sold it!（売っちゃったなんて信じられない）' },

    // R fix: V2 (blind 50 %): "concert shirts" became "get it back after the concert"; the stem no longer quotes s1's
    //   "can't"; it reveals the shirt
    // why: making it up ← "make me…" heard as make up, an offer to set things right; get it back ← "after we go to the
    //   concert" heard as when the shirt comes back
    { id: 'i2', skill: 'infer', level: 'C1', point: 'another', reveals: ['shirt'], seg: [209.2, 214.2],
      stem: 'What does Sam’s first reply to Carly’s anger show?',
      choices: ['She thinks the shirt can just be replaced', 'She feels bad and wants to make it up',
                'She’ll get the shirt back after the concert'], a: 0,
      cue: '「make me」のあとの一語と、そのあとの予定。',
      line: 'Look, *make me another shirt* if you want to *after we go to the… concert*.',
      said: '「なんならまた作ってよ、コンサートのあとでさ」と軽く返す。',
      mean: '作り直せばいい、という返事。手作りの重みが分かっていないので、カーリーの怒りは続く。',
      trap: 'make を「償う」の make up と結びつけやすい。謝りの言葉がなく、先に予定を言っている。',
      use: 'Don’t worry, I’ll get you another one.（大丈夫、また買ってくるよ）' },

    // R fix: V2 (blind 50 %): "agree the concert isn't worth it" became a contest over who is more hurt
    // why: more hurt ← the contest is heard, its content flipped; admitting they care ← "don't" is
    //   weak and "care" is said four times
    { id: 'h3', skill: 'humor', level: 'C1', point: 'care', seg: [219.1, 224.78],
      stem: 'Why is the back-and-forth about caring funny?',
      choices: ['They compete over who cares less', 'They compete over who is more hurt',
                'They both admit that they really care'], a: 0,
      cue: '同じ語を繰り返すたびに、何が付け足される？',
      line: 'I *care way less than you* care. — You don’t know *how much I don’t care*.',
      said: '「気にしてない」「そっちよりずっと」「どれだけ気にしてないか」と張り合う。',
      mean: '気にしていないことで勝ち負けを争うほど、本当は気にしている。',
      trap: 'don’t が弱く消えると、気にしていると認めたように聞こえる。less や don’t まで拾う。',
      use: 'I couldn’t care less.（全然気にしてない）' },

    // R fix: plain apostrophes in the answer; the cue pointed at the line before, which gives two of the four words;
    //   it reveals s1's "can't"
    // dict: "we're" is written "were" by a listener who hears only the weak vowel
    { id: 'x2', skill: 'dict', level: 'B2', point: 'stupid', reveals: ['cant'], seg: [227.95, 231.42],
      stem: 'Type the missing words: “I ___ this stupid conversation.” (4 words)',
      answer: "can't believe we're having",
      cue: 'I のあと、四語が一気につながる。',
      line: 'I *can’t believe we’re having* this stupid conversation.',
      said: '「こんなばかげた言い合いをしてるなんて信じられない」と言う。',
      mean: 'can’t の t はほぼ消え、we’re は「ウィア」と弱く短い。',
      trap: 'we’re を were と書きやすい。続く having が今の話なので、we are の短い形。',
      use: 'I can’t believe we’re lost again.（また迷うなんて信じられない）' },

    // why: late ← "I have to go to algebra class" taken at face value; bored ← the excuse is read right, the reason
    //   wrong: the next voice is Carly's, who has heard
    { id: 'i3', skill: 'infer', level: 'B2', point: 'algebra', seg: [239.95, 257.0],
      stem: 'Why does Sam bring up algebra class?',
      choices: ['To end the talk before Carly overhears', 'To end a talk that is boring her',
                'To remind her friend they’re late for class'], a: 0,
      cue: '直後に聞こえる、別の声の問い。',
      line: '*Whoa, I have to go to algebra class?* … — *You went to the concert?*',
      said: '思い出話の途中で、サムが急に「数学の授業に行かなきゃ」。直後にカーリーの声。',
      mean: '授業は口実。聞かれたくない話を打ち切ろうとしたが、もう遅かった。',
      trap: '退屈で逃げた、では直後の声とつながらない。急な話題の変更は、誰が聞いているかで読む。',
      use: 'Look at the time! I have to go.（もうこんな時間！行かなきゃ）' },

    // R fix: V2 (blind 55 %): "told her to take someone else" became a near miss on "You refused to go"
    // why: Tureen paid ← "you took Tureen" is the last thing Carly says, so Tureen seems part of the reason; Carly said
    //   go ← "You refused to go" heard as "you said you should go"
    { id: 'd2', skill: 'detail', level: 'B2', point: 'waste', seg: [253.2, 261.15],
      stem: 'How does Sam defend going to the concert without Carly?',
      choices: ['The tickets would have gone to waste', 'Tureen had paid for her own ticket',
                'Carly had said she should go anyway'], a: 0,
      cue: '「You refused to go」のあと、tickets の前の動詞。',
      line: 'You refused to go. — I wasn’t just gonna *waste the tickets*.',
      said: '「行かないと言ったのはそっち。無駄にはしない」と言う。',
      mean: 'wasn’t just gonna 〜 ＝ ただ〜するわけにいかなかった。言い訳の形。',
      trap: 'took Tureen が耳に残り、テュリーンの事情を想像しやすい。理由は wasn’t のあと。',
      use: 'I wasn’t gonna let it go to waste.（無駄にはしたくなかったんだ）' },

    // R fix: V2 (blind 60 %): "not speaking" became an order near miss; S4: the segment was 7.6 s, under a gist's 15 s
    // why: no more fighting ← the two "I'm sorry"s heard, "after some painful hair-pulling" missed; only Carly ← two "I'm sorry"s in a row
    //   heard as one voice
    { id: 'g2', skill: 'gist', level: 'B1', point: 'makeup', reveals: ['shirt'], seg: [261.9, 278.6],
      stem: 'How does the shirt fight end?',
      choices: ['They fight more, then both say sorry', 'They both say sorry without more fighting',
                'Carly says sorry, but Sam doesn’t'], a: 0,
      cue: '「painful」のあとの動作と、最後の二つの声。',
      line: 'the two were able to *make up*. — *I’m sorry.* — *I’m sorry.*',
      said: '「髪の引っぱり合いのあと仲直り」と言い、二人とも「ごめん」。',
      mean: 'make up ＝ 仲直りする。「ごめん」は二回、別々の声。',
      trap: 'ごめんが二つ聞こえても、その前に hair-pulling がある。after で順番を聞く。',
      use: 'Did you two make up yet?（二人はもう仲直りした？）' },

    // R fix: V2 (blind 60 %): "take back those words" became a blame near miss; the line no longer quotes s1's "can't"
    // why: making up ← "back" read as 戻る, coming back to the friendship; blame ← "right back at you" read as throwing
    //   the fault back
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'backat', seg: [264.2, 271.35],
      stem: 'What is the short reply to “I almost made up with you” doing?',
      choices: ['Returning the same feeling right back', 'Throwing the blame right back at her',
                'Offering to make up with her after all'], a: 0,
      cue: 'とても短い返事。直前の文への態度。',
      line: '… I almost made up with you. — *Back at you.*',
      said: '「仲直りしかけたなんて信じられない」に「こっちのセリフ」と返す。',
      mean: 'Back at you ＝ そっくり返す。ほめ言葉にも悪口にも使い、ここは怒りを返す。',
      trap: 'back を「戻る」と取ると仲直りの申し出に聞こえる。同じ気持ちを返す決まった形。',
      use: 'Have a great weekend! — Back at you!（よい週末を！—そっちもね！）' },

    // R fix: S4: whisper puts the line at 286.1 s, the captions at 288.3 s; the segment now holds both
    // anchor: 288.32–289.76 s both sources "I loves me the cold chili" (whisper 286.08 s): the -s and the "me" are in
    //   the audio
    // why: love the ← the grammar-correcting instinct drops the -s and the "me"; love my ← "me the" run together
    //   heard as "my"
    { id: 's2', skill: 'sound', level: 'C2', point: 'chili', seg: [283.4, 290.7],
      stem: 'Fill the gap: “I ___ cold chili.”',
      choices: ['loves me the', 'love the', 'love my'], a: 0,
      cue: 'love の語尾と、そのあとの短い二語。',
      line: 'I *loves me the* cold chili.',
      said: '「冷たいチリ、大好きだぜ」と、わざと崩した言い方で言う。',
      mean: 'I loves me the 〜 はわざと崩した口語。I でも s を付け、me を足して「大好き」を強める。',
      trap: '文法どおり I love the と聞きたくなる。s と me は弱いが、聞こえた音を文法で直さない。',
      use: 'I do love me a good pizza.（いいピザには目がない）', retired: true },

    // R fix: V2 (blind 80 %, the title answers it): despite/because is now the near miss; S4:
    //   the segment was 5.4 s, under a gist's 15 s
    // why: because of them ← "Even with" missed, the faults read as the fun part ("best and worst friend"); outweigh ←
    //   "all her faults" heard, "definitely a great friend" missed
    { id: 'g3', skill: 'gist', level: 'B1', point: 'verdict', seg: [312.6, 333.2],
      stem: 'In the end, how does the narrator weigh Sam’s faults?',
      choices: ['She’s a great friend despite them', 'She’s a great friend because of them',
                'They outweigh the good times with her'], a: 0,
      cue: '文頭の二語と、そのあとの definitely。',
      line: '*Even with all her faults*, Sam is *definitely a great friend* to have.',
      said: '「欠点はいろいろあっても、サムはやっぱり良い友だち」とまとめる。',
      mean: 'even with 〜 ＝ 〜があっても。欠点を認めたうえでの結論。',
      trap: '欠点を「楽しさの理由」と取ると、even with が逆になる。「あっても」は「せいで」ではない。',
      use: 'Even with the rain, we had fun.（雨でも楽しかった）' },

    // why: none ← "Freddie" heard, so Freddie must have eaten them; for after the show ← "after the show" is the last
    //   thing said, heard as when they can be eaten
    { id: 'd3', skill: 'detail', level: 'B1', point: 'pudding', seg: [317.6, 325.0],
      stem: 'What’s the answer to the pudding-cup question?',
      choices: ['Just one, and it’s promised to Freddie', 'None, since Freddie already ate them all',
                'A few, but only for after the show'], a: 0,
      cue: '最初の二語と、already のあと。',
      line: '*Just one*, and I already *promised Freddie* he could have it after the show.',
      said: '「プリンある？」に「一つだけ。もうフレディにあげる約束」と答える。',
      mean: 'just one ＝ 一つだけ。promised ＝ 約束済みで、渡せない。',
      trap: 'after the show が残り「番組のあとなら食べていい」と取りやすい。約束の相手を聞く。',
      use: 'Just one, and it’s already taken.（一つだけで、もう予約済み）' },
  ]
};
