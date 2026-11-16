// “Ron chooses love over meat | Parks and Recreation” (the official Parks and Recreation channel, Season 7): at
// Donna's wedding, Ron tells Lucy that Tom said he'd marry her tomorrow; Tom cuts off Ron's food until he fixes it,
// Ron's fix makes it bigger, and Tom ends up telling Lucy himself that he's all in.
// Segments from the captions, words from whisper (2026-11-16). Untested: 4–6 s ("Warm it up, please", a visual
// gag), 57–63 s (no captions; whisper only), 85–87 s (the small hamburgers), 92–93 s ("strict life codes" vs
// captions "life coach"), 127–131 s (camouflage), 201 s ("That's all I meant" vs captions "that's all I'm in").
// EAR CHECK: 103.4 s h3 — “That’s way in the future, man” is taken as Tom's (whisper has it in his turn; the captions
//   don't mark speakers), so “Don't call me man” is Ron's whole reply
// EAR CHECK: 195.6 s r1 — the cut falls after “You just have to ignore him”, before Lucy's “So you didn’t mean…”
//   (196.0 s)
// EAR CHECK: 217 s nt1 — Lucy's “only dating you for the free dresses” is teasing, not cool; the key also stands on
//   the words (“dating you”, and Tom's “I’m fine with that”)
// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 3
//   Open: who says “I don’t even know what you’re talking about, us having not talked about” (163 s)? Taken as Tom;
//   a2's stem no longer depends on it.
import type { Clip } from '../types.ts';

export const loveOverMeat: Clip = {
  id: 'loveovermeat', video: 'RV_n2gRdeqE', title: 'Ron chooses love over meat', dur: 241, wpm: 158, band: 'mid',
  tags: ['恋愛', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %: the gift worry clashed with "100%"). New: a hedged reading, which "forever" refutes.
    // why: propose ← "I'd marry her tomorrow" and "planned for tonight" run together; early days ← "finally feel
    //   like" heard as a cautious start
    { id: 'g1', skill: 'gist', level: 'B1', point: 'forever', reveals: ['dress'], seg: [12.9, 43.4],
      stem: 'Early on, what is Tom telling Ron about Lucy and himself?',
      choices: ['He sees her as the one for good', 'He plans to propose to her tonight', 'He’s happy, but it’s early days yet'],
      a: 0,
      cue: '「100%」のあと、forever と tomorrow。',
      line: 'I finally feel like I’m with the person I’m gonna be *with forever*. *I’d marry her tomorrow.*',
      said: '「ずっと一緒にいる相手に出会えた。明日にでも結婚したい」と話す。',
      mean: '今夜の予定から本気の気持ちへ。tomorrow は「それほど本気」のたとえ。',
      trap: 'tonight と tomorrow が近く、今夜プロポーズに思える。finally は「やっと」。',
      use: 'I think she’s the one.（彼女が運命の人だと思う）' },

    // R fix: K1 + V2 (blind 65 %). "Doesn't want to hear it" was defensible too: Ron plainly doesn't care. The key now
    //   holds both (literal, won't guess); the distractors are knowing already and banning plans.
    // why: knows ← "No" heard as "no need, I know"; no plans ← "No" heard as a ban on Tom's plan
    { id: 'h1', skill: 'humor', level: 'C1', point: 'guess', seg: [16.55, 22.5],
      stem: 'Why does Ron’s one-word reply to “guess what…” get a laugh?',
      choices: ['He takes the lead-in literally and won’t guess', 'He already knows the plan, so he needn’t guess',
                'He’s telling Tom not to make plans tonight'], a: 0,
      cue: '「guess what」のあとの一語と、Tom の続け方。',
      line: 'And *guess what* I have planned for tonight? — *No.* — As Donna’s butler of honor…',
      said: '「今夜の計画、当ててみて」に、ロンは「いや」とだけ答える。',
      mean: 'guess what は「聞いて」の前置き。ロンは字義どおり断っている。',
      trap: 'No を「知ってる」や「やめろ」と取りやすいが、Tom はかまわず続ける。',
      use: 'Guess what? I got the job!（聞いて！仕事決まった！）' },

    // why: part in the wedding ← "Donna's butler of honor" is Tom's own role; suit ← "baby blue brocade" is his own
    //   outfit
    { id: 'd2', skill: 'detail', level: 'B1', point: 'dress', seg: [19.1, 26.6],
      stem: 'What surprise has Tom gotten for Lucy?',
      choices: ['A dress that matches his outfit', 'A part in Donna’s wedding', 'A baby blue suit of her own'], a: 0,
      cue: '「As a surprise, I got」のあと。',
      line: 'Baby blue brocade. As a surprise, I got *a matching dress for Lucy*.',
      said: '「サプライズで、ルーシーにおそろいのドレスを買った」と言う。',
      mean: 'matching ＝ おそろいの。自分の衣装と合わせたドレスを用意した。',
      trap: 'butler of honor も brocade も Tom 自身の話。surprise のあとが贈り物。',
      use: 'We got matching shirts for the trip.（旅行用におそろいのシャツを買った）' },

    // why: 90% ← "hundred" half caught, heard as a lower guess; 110% ← the usual hype figure, which Tom might well use
    { id: 'n1', skill: 'number', level: 'B1', point: 'sure', seg: [26.55, 33.4],
      stem: 'How sure is Tom that Lucy will love the gift?',
      choices: ['90%', '100%', '110%'], a: 1, keep: true,
      cue: '「with this gift?」のすぐあと。',
      line: 'With this gift? — *100%.* We’re so in sync.',
      said: '「喜ぶと思う？」に「100パーセント。息ぴったりだから」と答える。',
      mean: '迷いなく言い切る。in sync ＝ 気持ちがぴったり合っている。',
      trap: '大げさな Tom なら110%も言いそうだが、and ten は続かない。',
      use: 'I’m a hundred percent sure.（100パーセント確かだよ）' },

    // R fix: V2 (blind 75 %: the title, "love over meat", points at food, and only the key had food). The "moved"
    //   choice now has food too: "I brought my own" heard as an offer.
    // why: offers food ← "if not, I brought my own" heard as a gift to the party; worried ← "bully" heard as the
    //   negative word (いじめ), as if he disapproves
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'bully', seg: [33.0, 43.4],
      stem: 'When Tom says he’d marry Lucy tomorrow, how interested is Ron?',
      choices: ['Not very: food is more on his mind', 'Very: he offers to bring food to celebrate',
                'Worried: he thinks Tom is rushing'], a: 0,
      cue: '「son」のあと、話題の変え方。',
      line: '*Bully for you*, son. *More importantly*, do you have tri-tip for tonight?',
      said: '「そりゃよかったな」と言い、「それより、今夜の肉はある？」と続ける。',
      mean: 'Bully for you は古風な「よかったね」で、少し気のない響き。',
      trap: 'bully をいじめと取ると反対に聞こえる。More importantly のあとが関心事。',
      use: 'Well, good for you.（へえ、よかったじゃない）' },

    // why: food ← "Good food" is listed first; love ← "the celebration of romantic love" is listed second
    { id: 'd3', skill: 'detail', level: 'B1', point: 'churches', seg: [45.5, 57.2],
      stem: 'In Ron’s talk to the camera, what does he like most about weddings?',
      choices: ['The buildings they are held in', 'The food that is served there', 'The love that they celebrate'], a: 0,
      cue: '「most of all」のあとと、その理由。',
      line: 'Good food, the celebration of romantic love, and *most of all, churches*… knew how to *construct an edifice*.',
      said: '「料理、恋愛のお祝い、何より教会」と挙げ、建物の造りをほめる。',
      mean: 'most of all ＝ 何よりも。教会を挙げる理由は宗教ではなく、建物の見事さ。',
      trap: '3つ並ぶので最初の food に引っぱられやすい。most of all のあとが一番。',
      use: 'Most of all, I love the quiet.（何より静かなのがいい）' },

    // R fix: K1: "says sorry" overstated it; "I normally don't…, but" excuses, it doesn't apologize.
    // why: won't discuss ← "I normally don't get involved" heard as a refusal; asks ← "I'll just say it" heard as
    //   asking leave
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'leadin', seg: [62.9, 72.5],
      stem: 'Before telling Lucy his news, what does Ron’s long lead-in do?',
      choices: ['Excuses himself ahead of time for meddling', 'Says he won’t discuss Tom’s private life',
                'Asks whether Lucy wants to hear news'], a: 0,
      cue: '「normally」と、but のあと。',
      line: 'I *normally don’t get involved* in people’s personal affairs, *but*…',
      said: '「ふだんは人の私生活に口は出さないが、結婚式だとな」と前置きする。',
      mean: '口出しする前の言い訳。「普段はしないけど」と断ってから本題に入る。',
      trap: 'don’t get involved だけ聞くと断りに聞こえる。normally と but が例外の合図。',
      use: 'I don’t usually say this, but…（普段は言わないけど…）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'sayit', seg: [68.85, 72.5],
      stem: 'Type the end: “but something about a wedding, ___.” (4 words)', answer: "i'll just say it",
      cue: 'wedding のあと、短い4語。',
      line: 'but something about a wedding, *I’ll just say it*.',
      said: '「結婚式ってやつは何かあってな、もう言ってしまおう」と言う。',
      mean: 'I’ll は「アル」と弱く、just の t は say の前で消えて「ジャスセイ」。',
      trap: 'I will と書きたくなるが、音は I’ll。just の t が聞こえなくても4語ある。',
      use: 'I’ll just say it: I’m nervous.（はっきり言うと、緊張してる）' },

    // R fix: V2 (blind 60 %: the key was the only warm choice). "Quite" read as "somewhat" is the new near miss, and
    //   the segment now runs to "He said he'd marry you tomorrow" (79.2 s), which refutes it.
    // why: a little ← "quite" read as "fairly"; fooled ← "taken" heard as "taken in" (だまされる)
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'taken', seg: [70.5, 80.0],
      stem: 'What does Ron tell Lucy about Tom’s feelings?',
      choices: ['He likes her very much', 'He likes her, just a little', 'He’s been fooled by her'], a: 0,
      cue: '「I’ll just say it」のあと、with you の前。',
      line: 'Tom is *quite taken with you*. — He’s taken with me, huh?',
      said: '「トムは君にすっかり夢中だ」と言われ、「夢中なんだ、へえ」と聞き返す。',
      mean: 'be taken with ～ ＝ ～に心ひかれている。少し古風な言い方。',
      trap: 'quite を「まあまあ」と取りやすいが、ここは「かなり」。taken in とも違う。',
      use: 'I was quite taken with the city.（その街がすっかり気に入った）' },

    // R fix: V2 (blind 55 %). "Say more" becomes "say it again more gently", a softer near miss.
    // why: gently ← "walk back" heard as going back to her to redo it; walk away ← "walk" heard as leaving
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'walkback', seg: [86.75, 91.6],
      stem: 'What does Tom want Ron to do about what he told Lucy?',
      choices: ['Take back his words', 'Say it again more gently', 'Walk away and leave it'], a: 0,
      cue: '「Ron,」のあと、what you said の前。',
      line: 'you have to *walk back* what you said. — Walk back *sounds like lying*.',
      said: '「言ったことを取り消して」と頼むと、「取り消しはうそみたいだ」と断られる。',
      mean: 'walk back ＝ 発言を撤回する。本当の事を消すのはうそ、という考え。',
      trap: '文字通り「歩いて戻る」と取りやすい。返事の lying が、言葉の話だと教えてくれる。',
      use: 'He had to walk back his comments.（彼は発言を撤回するはめになった）' },

    // R fix: V2 (blind 60 %: the island-laugh was a filler). New keyword trap from Ron's "Walk back sounds like
    //   lying" a few seconds earlier.
    // why: too far ahead ← "That's way in the future" is Tom's own line, easy to give to Ron; lying ← Ron's refusal
    //   at 90 s, the last thing he objected to
    { id: 'h3', skill: 'humor', level: 'C1', point: 'man', seg: [101.4, 109.5],
      stem: 'After Tom describes his future with Lucy, why does he snap at Ron?',
      choices: ['Ron picks on one word and skips the problem', 'Ron says Tom’s plans are too far ahead',
                'Ron won’t help, since it would mean lying'], a: 0,
      cue: 'Ron の短い返事と、Tom の「That’s what…」。',
      line: 'That’s way in the future, man. — *Don’t call me “man.”* — *That’s what you took away from this?!*',
      said: '夢を語る Tom に、ロンは「man と呼ぶな」とだけ返し、Tom がキレる。',
      mean: '大問題の相談中に、呼び方だけに反応している。',
      trap: 'That’s way in the future は Tom の言葉。ロンは一言だけ。',
      use: 'That’s what you got from all that?（あれ全部聞いて、そこ？）' },

    // R fix: V2 (blind 60 %: "joking" was weak). New: a punishment for good, which "until" refutes.
    // why: leave ← "Don't serve this man" is the bar script for throwing someone out; for good ← "No more food"
    //   heard without "until"
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'food', seg: [110.5, 115.8],
      stem: 'What is Tom doing when he tells the server not to serve Ron?',
      choices: ['Holding back Ron’s food to make him act', 'Asking the staff to make Ron leave now',
                'Cutting Ron off for good to punish him'], a: 0,
      cue: '「Don’t serve this man」のあと、条件の言葉。',
      line: 'Don’t serve this man. *No more food until he fixes* a giant disaster he’s created.',
      said: '「この人に出さないで。自分の起こした大惨事を直すまで食べ物なし」と言う。',
      mean: 'ロンの一番の弱点、食べ物を人質にしている。until が条件を示す。',
      trap: '店から追い出す決まり文句に聞こえるが、until 以下で「直せば出す」と分かる。',
      use: 'No dessert until you finish your vegetables.（野菜を食べるまでデザートなし）' },

    // R fix: V2 (blind 60 %: "a lion" made no sense). It's now "not a liar", which he does say three seconds later.
    // why: lawyer ← the l and the vowels blur, and "I have something to tell you" sets up a confession about himself;
    //   not a liar ← said at 124 s, in his correction; the "What?" in between shows the first line was the odd one
    { id: 's1', skill: 'sound', level: 'B2', point: 'liar', seg: [116.4, 127.55],
      stem: 'Fill the gap: “Lucy, I have something to tell you. I am ___.”',
      choices: ['a liar', 'not a liar', 'a lawyer'], a: 0,
      cue: '「I am」のあと。次の文で本人が言い直す。',
      line: 'I am *a liar*. — What? — Well, no, I am *not a liar*. I have *never lied*…',
      said: '「私はうそつきだ」と言い、すぐ「いや、うそはついたことがない」。',
      mean: 'liar は「ライアー」で、最後の r は弱い。直後の lied が仲間の語。',
      trap: 'lawyer（ローヤー）は最初の母音が違う。迷ったら、すぐあとの lied で確かめる。',
      use: 'I’m a terrible liar.（うそをつくのがすごく下手なんだ）' },

    // R fix: V2 (blind 50 %). The takes-back choice now pairs "I am a liar" with Lucy's real confusion ("What is
    //   happening right now?"), so it's a near miss that "no, I am not a liar" refutes.
    // why: softens ← "he likes you a great deal" sounds like a gentler version; admits he lied ← he opens with "I am
    //   a liar", and Lucy is indeed confused
    { id: 'g2', skill: 'gist', level: 'B2', point: 'fix', reveals: ['liar'], seg: [116.4, 151.3],
      stem: 'How does Ron’s attempt to fix things with Lucy turn out?',
      choices: ['He makes it bigger, adding more of Tom’s plans', 'He softens it, and Lucy calms down',
                'He admits he lied, and Lucy is confused'], a: 0,
      cue: 'ロンの説明のあとの、Lucy の聞き返し。',
      line: 'he could imagine marrying you and *living on an island with your kids*. — Wait, now we’re on an island with *kids, plural*?',
      said: '「好きだと伝えたかっただけ」と言いつつ、結婚、島、子どもまで話してしまう。',
      mean: '取り消すはずが、Tom の夢をさらに詳しく伝えて、話を大きくしてしまった。',
      trap: 'I am a liar は撤回に聞こえるが、すぐ自分で否定する。now は「さらに」。',
      use: 'That only made things worse.（それで余計にややこしくなった）' },

    // R fix: V2 (blind 65 %: only the key had a reason tied to the scene). "Bring Lucy something" becomes a kind
    //   reason with food in it, so food isn't the tell.
    // why: cheer up ← "do you know where I can find" heard as a kind errand for her; shame ← the Japanese frame: a
    //   sudden change of topic after an awkward moment read as 気まずさ
    { id: 'i4', skill: 'infer', level: 'C1', point: 'hamballs', reveals: ['food'], seg: [146.5, 151.3],
      stem: 'Why does Ron ask about the ham balls right after Lucy’s question?',
      choices: ['He thinks his job is done, so he can eat', 'He wants to cheer Lucy up with some food',
                'He is changing the subject out of shame'], a: 0,
      cue: '「Yes.」のあと、Now で変わる話題。',
      line: 'kids, plural? — Yes. *Now, do you know where I can find those little ham balls?*',
      said: '「子ども、複数？」に「そうだ」と答え、すぐハムボールの場所を聞く。',
      mean: '直すまで食べ物なし、の条件を果たしたつもり。用は済んだので食べ物に戻る。',
      trap: '急な話題の変更は気まずさにも見えるが、ロンは堂々としている。Now は「用件は終わり」。',
      use: 'Now, where’s the coffee?（さて、コーヒーはどこ？）' },

    // R fix: V2 + N (blind 55 %). The stem no longer names Tom as the speaker (no name settles it), and the choices
    //   are parallel "X, since/which…" with a puzzled near miss.
    // why: puzzled ← "I don't even know what you're talking about" taken at face value; annoyed ← Ron did meddle
    //   earlier, so a brush-off sounds like irritation
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'denial', seg: [153.0, 166.65],
      stem: 'When Ron says they haven’t talked yet, how does the denial come across?',
      choices: ['Rattled, which suggests Ron is right', 'Puzzled, since they really have talked',
                'Annoyed, since Ron keeps getting involved'], a: 0,
      cue: '「What?」のあと、Tom の文の終わり方。',
      line: 'I further suspect you have not yet talked… — What? I don’t even know what you’re talking about, *us having not talked about*.',
      said: '「まだ話してないだろう」と言われ、もつれた返事で打ち消す。',
      mean: '知らないと言いながら、ロンの言葉をなぞってしまう。慌てていて、図星だと分かる。',
      trap: '「分からない」を文字通り取ると、ただの困惑に見える。文が崩れるのは動揺の合図。',
      use: 'I have no idea what you mean.（何のことだか全然）' },

    // anchor: 165.2–166.6 s, right after "what you're talking about": five words, "us having not talked about" in
    //   both sources; grammar would rewrite them
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'denial', seg: [161.95, 166.65],
      stem: 'Type the end: “I don’t even know what you’re talking about, ___.” (5 words)',
      answer: 'us having not talked about',
      cue: 'about のあと、同じ about で終わる言い直し。',
      line: 'I don’t even know what you’re talking about, *us having not talked about*.',
      said: '「何の話か分からない、僕らが話してないっていう何かなんて」と、ロンの言葉をなぞって打ち消す。',
      mean: '文法では崩れた言い方。ロンの「まだ話していない」をそのまま否定しようとして、文がもつれた跡。',
      trap: '正しい文に直したくなるが、書き取りは聞こえた音を書く。having not の順番もそのまま。',
      use: 'I don’t know what you mean, honestly.（何のことだか、本当に分からない）' },

    // R fix: V2 (blind 60 %: "keep quiet" was weak). New: the apology read as asking forgiveness (the Japanese frame).
    // why: say sorry ← "I am sorry if I caused a problem" is said, but by Ron about himself; forgive ← an apology
    //   heard as a request to be forgiven
    { id: 'i6', skill: 'infer', level: 'B2', point: 'cherish', seg: [166.65, 177.2],
      stem: 'In Ron’s apology, what is he really urging Tom to do?',
      choices: ['Tell Lucy openly how he feels', 'Say sorry to Lucy for Ron’s words', 'Forgive Ron for what he told Lucy'],
      a: 0,
      cue: '「no shame in」のあと、何をすることか。',
      line: 'there’s *no shame in declaring how you feel* to a person you cherish.',
      said: '「大切な人に気持ちを伝えるのは恥じゃない」と言い、ロンは謝る。',
      mean: '謝る形で、Tom の背中を押している。no shame in ～ ＝ ～は恥じゃない。',
      trap: 'sorry はロン自身の謝罪。Tom にさせたいのは、no shame in のあとの行動。',
      use: 'There’s no shame in asking for help.（助けを求めるのは恥じゃない）' },

    // why: good name ← all the talk of lying earlier ("walk back sounds like lying"); bet ← "Michigan limestone" is
    //   said, in a different relation
    { id: 'd5', skill: 'detail', level: 'B2', point: 'cost', seg: [177.2, 189.0],
      stem: 'As he leaves, what does Ron say helping them cost him?',
      choices: ['The food, and a talk he’d have enjoyed', 'The food, and his good name for honesty',
                'A bet about Michigan limestone'], a: 0,
      cue: '「excuse me」のあと、missed と denied。',
      line: 'I *missed out on the food* and was *denied a fascinating conversation* about Michigan limestone…',
      said: '「食べ物を逃し、ミシガンの石灰岩の面白い話も聞けなかった」と言う。',
      mean: 'miss out on ＝ 逃す。be denied ＝ 与えられない。どちらもロンには大きな損。',
      trap: 'うその話が多かったので名誉と思いやすいが、挙げたのは食べ物と会話の2つ。',
      use: 'I missed out on the free lunch.（無料のランチを逃した）' },

    // R fix: V2 (blind 55 %: the thank-you was weak). New near miss: a question, but about Ron.
    // why: agrees ← "this weird thing" invites a shared laugh about Ron; about Ron ← the right kind of move (a
    //   question), aimed at the wrong man
    { id: 'r1', skill: 'predict', level: 'B2', point: 'didntmean', seg: [189.9, 195.6], then: [195.6, 198.4],
      stem: 'After Tom tells Lucy to ignore Ron, what kind of reply is coming?',
      choices: ['A check on whether Tom meant it at all', 'A laugh that agrees Ron is a bit odd',
                'A question about what Ron really meant'], a: 0,
      cue: '「ignore him」が、ロンの言った何を打ち消すか。',
      line: 'You just have to *ignore him*. — *So you didn’t mean what you said?*',
      said: '「無視すればいい」に、Lucy は「本気じゃなかったの？」と聞く。',
      mean: 'ロンを無視しろ＝ロンが伝えた結婚の話も無視しろ、になる。Lucy はそこを確かめる。',
      trap: '変わり者の話で笑って終わりそうだが、無視するのは Tom の気持ちの話でもある。',
      use: 'So you didn’t mean it?（じゃあ、本気じゃなかったの？）' },

    // R fix: V2 (blind 50 %). The Lucy choice now has a reason a listener could hold: "ignore him" heard as "he
    //   made it up", which "says exactly what he means" refutes.
    // why: Ron ← the line is about Ron and calls him weird (right mechanism, wrong target); Lucy ← "You just have to
    //   ignore him" heard as Ron having invented the story
    // anchor: 190.4–193.3 s the "weird thing" is named as "says exactly what he means", which is only honesty;
    //   196.0–197.9 s Lucy's "So you didn't mean what you said?" turns his excuse against him
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'didntmean', seg: [189.9, 198.4],
      stem: 'In Tom’s line about Ron’s “weird thing”, who is the joke on?',
      choices: ['Tom, who treats plain honesty as odd', 'Ron, who is too blunt to be around',
                'Lucy, who believed a story Ron made up'], a: 0,
      cue: '「weird thing」が、具体的に何なのか。',
      line: 'Ron does this *weird thing where he says exactly what he means*. — So you didn’t mean what you said?',
      said: '「ロンは思ったままを言う変なくせがある。無視して」と言い、「本気じゃなかったの？」と返される。',
      mean: '変だと言った中身は、ただの正直さ。言い訳のつもりが、自分は本音を言わない側だと認める形になる。',
      trap: 'weird はロンへの言葉なので、笑われるのもロンと思いやすい。何を変と呼んだかを聞く。',
      use: 'He’s weirdly honest. It’s great.（彼、変なくらい正直。そこがいい）' },

    // R fix: V2 (blind 55 %: "worn out" was weak). New keyword trap: "That's all I meant" follows at once.
    // why: done talking ← "all in" plus "That's all I meant" heard as "that's all"; move in ← "in" heard as moving in
    //   together
    { id: 'p4', skill: 'phrase', level: 'B2', point: 'allin', seg: [198.7, 202.3],
      stem: 'When Lucy asks if he meant it, what does Tom tell her first?',
      choices: ['That he’s completely serious', 'That he’s done talking about it', 'That he wants to move in'], a: 0,
      cue: '「Look,」のあとの短い3語。',
      line: 'Look, *I’m all in*.',
      said: '「いいかい、僕は本気だ」と答える。',
      mean: 'all in ＝ ポーカーで全部賭けること。気持ちを全部かけている、本気だという意味。',
      trap: 'all と in だけ拾うと「もう終わり」や「同居」に聞こえる。Look のあとの決意の一言。',
      use: 'If you’re in, I’m all in.（君がやるなら、僕も全力で）' },

    // R fix: K1 + V2 (blind 70 %). "Crazy" is also what he feared, so "what was he afraid she'd think" had two
    //   answers; the stem now sets "crazy" aside. "Angry" (a filler) becomes the opposite timing.
    // why: joking ← "crazy" heard as kidding around; too late ← "gun" heard as a start signal, but the direction
    //   (early vs late) lost
    { id: 'p5', skill: 'phrase', level: 'B2', point: 'gun', seg: [201.4, 205.1],
      stem: 'Besides “crazy”, what was Tom afraid Lucy would think of him?',
      choices: ['That he was moving too fast', 'That he was only joking', 'That he had waited too long'], a: 0,
      cue: '「crazy or」のあと。',
      line: 'I didn’t want you to think I was crazy or *jumping the gun*.',
      said: '「頭がおかしいとか、先走ってるとか思われたくなかった」と言う。',
      mean: 'jump the gun ＝ 号砲の前に飛び出す。早まる、先走るという意味。',
      trap: 'gun はスタートの合図。遅れたのではなく、合図の前に飛び出す、つまり早すぎること。',
      use: 'Let’s not jump the gun here.（ここは早まらないでおこう）' },

    // why: gentle no ← "you just got out of a relationship" (Tom's own words) primes a polite refusal; real warning ←
    //   "only… for the free dresses" taken at face value (the matching dress was his surprise)
    // anchor: 199.2–211 s Tom's "I'm all in… I don't expect you to feel the same way"; 215.9–218 s she answers with a
    //   joke about his gift and the present-tense "dating you", not a "but"; 219.7–220.6 s "I'm fine with that"
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'dresses', reveals: ['allin'], seg: [215.0, 221.0],
      stem: 'How should Tom hear Lucy’s line about the free dresses?',
      choices: ['As a playful yes: she’s glad he feels this way', 'As a gentle no: she isn’t ready after her breakup',
                'As a real warning: she cares more about gifts'], a: 0,
      cue: '彼女の文の動詞と、Tom の返事。',
      line: 'Well, I’m *only dating you for the free dresses*, so… — *I’m fine with that.*',
      said: '「同じ気持ちは求めない」と言う Tom に、「タダのドレス目当てで付き合ってるだけ」と返す。',
      mean: '本気なら物目当てだが、dating you と付き合いを認めた上での冗談。照れ隠しの返事。',
      trap: '別れたばかりの話から、断ったと取りやすい。断るなら but が来る。動詞 dating を聞く。',
      use: 'I’m only here for the free food.（タダのご飯目当てで来ただけだよ）' },
  ]
};
