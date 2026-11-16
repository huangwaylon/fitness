// REVIEW 2026-11-16: pass 5, fix 18, drop 1, new 1; ear checks 2
// OPEN: g1 and g2 still drew 75 % on a cold blind re-read (the title "Set Tour"; the truth is the balanced "a little
//   old, a little new"); no honest key avoids that.
// “Spencer is Rich?!  New iCarly Set Tour w/ Miranda Cosgrove and Jerry Trainor! | NickRewind” (NickRewind, official
// YouTube channel, Best of Carly Shay ❤️): Miranda and Jerry walk through Spencer's remodelled apartment on the new set,
// comparing it with the old one and joking as they go.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Miranda and Jerry (5.9–14.8 s,
// 179.2 s). Who says which line is mostly not settled by the words, so stems say "the speaker" or "the reply", and no
// item asks who.
// Untested: 127–134 s and 172–177 s (whisper only: the glued item, "He collects records", the stairs chat), 201–209 s
// (whisper "You can cuss?", captions "what you confess"), 214–216 s ("that was actually the coolest" whisper only),
// 229–237 s (whisper "nobody ever saw it", "She meant fortunately", "Jerry hates the gum wall", "No."; captions only
// "unfortunately unfortunately"), 239–249 s (the bass guitars: "chicks dig bassists", talk overlaps), 303–305 s
// (whisper "this has been Jerry and…", captions "this is benjarian"), 87–100 s (the stove: "in-counter" vs "encounter").
// EAR CHECK: 217.9 s i3 — whisper "In a post-COVID world", captions "post-covered world" (an ASR slip?); the key also
//   stands on "we're not gonna stick food on anything" (both sources)
// EAR CHECK: 315.8 s c1 — "Still got it" lands as a joke on themselves right after the stammered sign-off, not as a
//   straight boast (the anchor is the fumble at 305.8–313.8 s, in both sources)
import type { Clip } from '../types.ts';

export const icSetTour: Clip = {
  id: 'icsettour', video: 'Vu51nHUs-AU', title: 'Spencer is Rich?!  New iCarly Set Tour w/ Miranda Cosgrove and Jerry Trainor!',
  dur: 331, wpm: 176, band: 'fast', tags: ['家', '友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: blind 85 %: the title ("New iCarly Set Tour") gave the old/new frame against weak fillers; now the
    //   title's other half ("Spencer is Rich?!") is a distractor too, refuted because no price is ever named
    // why: cost ← the title and "now that Spencer is rich", "fancy fridge", "upgraded"; how sets are built ← "the back of
    //   one of the sets", "it goes nowhere": set-making facts come up along the way
    { id: 'g1', skill: 'gist', level: 'B2', point: 'tour', seg: [5.4, 317.6],
      stem: 'Throughout the tour, what do they mostly point out?',
      choices: ['What’s kept or changed from the old apartment', 'How much Spencer’s new things must have cost',
                'How the crew built and lit each of the sets'], a: 0,
      cue: '何度もくり返し出てくる、時をくらべる言葉。',
      said: 'スツール、ソファ、キッチン、自転車などを、元の部屋とくらべながら、今の部屋を紹介していく。',
      mean: '「昔はこうだった、今はこう」のくり返しが、この見学の骨組みになっている。',
      trap: '途中の冗談や撮影の裏話に気を取られやすい。何度もくり返される形が、全体の要点。',
      use: 'Compared to before, it’s way nicer.（前とくらべて、ずっといい）' },

    // R fix: blind 80 %: "playful" is the default for a promo; now all three describe the intro itself, and the
    //   fumbling reading is a real near miss
    // why: awkward ← the "uh" and the repeated names heard as fumbling; formal ← full names and "… here", the
    //   TV-presenter opening
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'intro', seg: [5.4, 15.2],
      stem: 'How do the two come across as they open the video?',
      choices: ['Silly, making a bit out of their own intros', 'Awkward, fumbling their own introductions',
                'Formal, giving full names for the record'], a: 0,
      cue: '名前を言ったすぐあとの「who are you?」。',
      line: 'Miranda Cosgrove here. This is Jerry Trainor. *We look great.* So, hi, *who are you?*',
      said: '名乗ったばかりなのに「で、どなた？」と聞き、もう一度名乗り合う。',
      mean: '分かりきったことをわざと聞き直す、ふざけたあいさつ。',
      trap: 'uh や名前のくり返しは緊張にも見えるが、名乗った直後の「どなた？」は冗談。',
      use: 'And you are…? Oh right, my brother.（で、どなた？…ああ、兄だった）' },

    // R drop d1: the video's title ("Spencer is Rich?!") answered it (blind 90 %, GUIDE §9.4); never shipped, deleted
    // R new: the same moment from the other side: how he got rich, from “Get into art. That's where the real money is”
    //   (both sources; whisper "Making it rig", captions "making it rain" is not needed). Blind read ~40 %
    // why: lottery ← the usual sudden-wealth script, and "making it rain" heard as luck; web show ← "updated" plus Carly's
    //   show from the old series, a partial listener's guess
    { id: 'd6', skill: 'detail', level: 'B1', point: 'rich', seg: [15.0, 27.4],
      stem: 'How did Spencer get rich, by their joke?',
      choices: ['Through making art', 'Through a lottery win', 'Through Carly’s web show'], a: 0,
      cue: '「rich」のあと、子どもたちへの一言。',
      line: 'now that Spencer is rich. … *Get into art*. That’s where the *real money* is, kids.',
      said: 'お金持ちになったと言い、「アートをやりなさい、本当のお金はそこだ」と続ける。',
      mean: 'アートで金持ちになった、という冗談。実際はアートはあまり稼げないので笑いになる。',
      trap: '急なお金持ちは宝くじ、と考えやすい。kids に向けた一言が理由を言っている。',
      use: 'That’s where the real money is.（本当にもうかるのはそこだよ）' },

    // anchor: 60.3–61.3 s, both sources "there used to be like a wall here": five weak words in one run, with a filler
    //   "like" that grammar would leave out
    { id: 'c2', skill: 'dict', level: 'C2', point: 'wall', seg: [59.0, 61.85],
      stem: 'Type the words: “there ___ wall here.” (5 words)', answer: 'used to be like a',
      cue: '2回目の「there」のあと。文法より、聞こえた音を。',
      line: 'so there was, there *used to be like a* wall here',
      said: '「前はここに、なんか壁があってね」と思い出しながら話す。5語とも弱く、ひと続き。',
      mean: 'used to be ＝ 前は〜があった。like は意味のないつなぎだが、会話ではよく入る。',
      trap: 'like を消して書きたくなる。to は「タ」、be like は短くつながる。書き取りは音どおりに。',
      use: 'There used to be a café here.（前はここにカフェがあった）' },

    // R fix: blind 75 %: the distractors weren't about the word; now a wrong-target reading of the same word competes
    //   (rude about the show vs about themselves), settled by "I'm not that old"
    // why: carried away ← "calm down" taken literally after "super cool"; unkind to the show ← right mechanism (the word
    //   stings), wrong target
    { id: 'h2', skill: 'humor', level: 'C1', point: 'oldfash', seg: [64.4, 76.6],
      stem: 'Why the “let’s calm down” right after the old computer comes up?',
      choices: ['Calling it old-fashioned makes them sound old', 'Calling it old-fashioned is unkind to the old show',
                'Someone got carried away describing the computer'], a: 0,
      cue: '「calm down」のあと、最後の短い一文。',
      line: 'Old-fashioned. *Let’s calm down*. … it was *modern then*. *I’m not that old*.',
      said: '古いパソコンを old-fashioned と言ったところで「落ち着こう。そこまで年じゃない」と続く。',
      mean: '古い物と言うと自分も古いようで、わざと大げさに抗議している。',
      trap: 'calm down を文字どおり取りやすい。最後の一文が答え。',
      use: 'Whoa, whoa. I’m not that old!（ちょっと、そこまで年じゃないって！）' },

    // R fix: blind 60 %: "swapped the new fridge for an old one" was a filler; now a near miss keeps the layout and adds
    //   appliances, refuted by "he knocked out the wall"
    // why: old layout ← "these stools were there" and the "fancy fridge", with "knocked out" missed; rebuilt like the
    //   original ← "throwback" heard as bringing the old room back
    { id: 'd3', skill: 'detail', level: 'B2', point: 'kitchen', seg: [76.2, 87.45],
      stem: 'What has Spencer done to the kitchen?',
      choices: ['Knocked out a wall and modernized it', 'Kept the old layout, adding new appliances',
                'Rebuilt it to look just like the original'], a: 0,
      cue: '「throwback」のあとの「but」。',
      line: 'this is kind of a throwback, but *he knocked out the wall*… *modernized the kitchen*',
      said: 'スツールは昔のまま。でも壁を取り払い、キッチンを今風にした、と言う。',
      mean: 'knock out a wall ＝ 壁を取り払う。古い物を残し、間取りは新しく。',
      trap: 'throwback（懐かしい物）のあと but で話が逆になる。but の後ろが今の様子。',
      use: 'We knocked out a wall last year.（去年、壁を一つ抜いた）' },

    // R fix: blind 75 % (K1 too): "gave away a secret" was defensible, since "as soon as Carly moves out" is said just
    //   before and could be a spoiler. It becomes the cost reading, refuted by "sorry" landing right on "lame"
    // why: broke a prop ← "sorry" plus a company name is the usual apology for damage; cost ← "rich", "updated" and
    //   "get rid of all" heard as the studio's money spent
    { id: 'i1', skill: 'infer', level: 'C1', point: 'paramount', reveals: ['cheesy'], seg: [100.5, 113.1],
      stem: 'Why does someone say “Sorry, Paramount” here?',
      choices: ['They just called the studio’s old set lame', 'They broke a prop that belongs to the studio',
                'They joked the remodel cost the studio a lot'], a: 0,
      cue: '直前の一言と、だれに謝っているか。',
      line: 'let’s *get rid of all the cheesy, lame stuff*. … *Sorry, Paramount*.',
      said: '「Spencer はダサい物を全部捨てた」と言ったあと、「ごめんね、パラマウント」。',
      mean: '昔のセットは番組の会社の物。それを「ダサい」と言ったので冗談で謝る。',
      trap: 'sorry ＋会社名で「壊した」と取りやすい。直前の一言が謝る理由。',
      use: 'No offense, Mom, but this is better.（ママ、悪いけどこっちの方がいい）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'cheesy', seg: [102.5, 108.3],
      stem: 'Type the words: “Spencer’s like, let’s ___ all the cheesy, lame stuff.” (3 words)', answer: 'get rid of',
      cue: '「let’s」のすぐあと。',
      line: 'Spencer’s like, let’s *get rid of* all the cheesy, lame stuff',
      said: '「Spencer は『ダサい物は全部処分しよう』って感じ」。',
      mean: 'get rid of ＝ 処分する。ここの like は「〜って感じ」と気持ちを代わりに言う。',
      trap: 'get と rid がつながり「ゲリッド」、of は弱く「ア」に近い。',
      use: 'I need to get rid of old clothes.（古い服を処分しなきゃ）' },

    // R fix: blind 50 % and right: "young family" was far from the phrase; now the bachelor-party reading competes
    // why: college grad ← bachelor = 学士 (a bachelor's degree); newlywed ← "bachelor party" is the night before a wedding
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'bachelor', seg: [109.7, 114.6],
      stem: 'What kind of home is the apartment now, they say?',
      choices: ['A place for a single guy', 'A place for a college grad', 'A place for a newlywed guy'], a: 0,
      cue: '「Sorry, Paramount」のあと、2回くり返す言い方。',
      line: 'It’s a *bachelor pad* now.',
      said: '「今は独身男の部屋だ」と二人でくり返す。',
      mean: 'bachelor pad ＝ 独身男性の住まい。pad はくだけた「部屋」。',
      trap: 'bachelor は「学士」の意味もあり、大学の話に引かれやすい。pad と組むと独身男の部屋。',
      use: 'Nice place! Very bachelor pad.（いい部屋！いかにも独身の部屋だね）' },

    // R fix: blind 75 %: the key was the only positive choice; now a second "likes" reading hears only "not the same"
    // why: nothing like ← "it's not the same as the old couch" heard, "similar stuff" missed; wishes ← "not the same"
    //   heard as a complaint
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'couch', seg: [114.1, 127.3],
      stem: 'How does the speaker feel about the new couch?',
      choices: ['Likes that it’s a bit like the old one', 'Likes it, though it’s nothing like the old one',
                'Wishes it were just like the old one'], a: 0,
      cue: '「I thought it was」のあとの一語と、but のあと。',
      line: 'I thought it was *cool* that the couch… it’s *not the same* as the old couch, *but* there’s some similar stuff',
      said: 'ソファは前と同じではないが、クッションの柄などが前のを思い出させていい、と言う。',
      mean: '同じではないが似ている、そのほどよさを気に入っている。',
      trap: 'not the same だけだと不満に聞こえる。最初の cool と but のあとで分かる。',
      use: 'It’s not the same, but I like it.（同じじゃないけど、好きだな）' },

    // why: falling off ← glue's usual job is to keep things in place; breaking his art ← "rash" heard as rush/clumsy
    //   (慌てて), and Spencer's art comes up at 24 s
    // R fix: the cue quoted "there's been", words only the key has (cue-leak test); it now points at the place only
    { id: 'd4', skill: 'detail', level: 'B2', point: 'glue', seg: [134.2, 140.6],
      stem: 'Why does Spencer glue his things down, according to them?',
      choices: ['There have been a lot of break-ins', 'His things keep falling off the shelves',
                'He keeps breaking his own art'], a: 0,
      cue: '「glues down」のすぐあとの理由。',
      line: 'Spencer glues down his stuff. There’s been *a rash of burglaries*. We’ve been robbed.',
      said: '「物を接着している。泥棒が続いていて、うちもやられた」と言う。',
      mean: 'a rash of ～ ＝ 悪いことが短い間に続くこと。burglary ＝ 空き巣。',
      trap: 'rash はなじみが薄い。後ろの burglaries と robbed から意味をつかむ。',
      use: 'There’s been a rash of colds at work.（職場で風邪がはやってる）' },

    // R fix: blind 60 %: the key was the only one with "still", the stem's natural partner; two choices now say "still"
    // why: sleek modern ← "mid-century modern" heard as just "modern"; pricey ← he is rich now (21 s), and "penchant" is
    //   unknown; "vintage-y", "kitschy", "artsy" say the opposite
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'penchant', seg: [153.7, 162.1],
      stem: 'What does the speaker say about Spencer’s taste now?',
      choices: ['He still loves kitschy, vintage, arty stuff', 'He still loves sleek, modern designer stuff',
                'He now buys only pricey, fancy stuff'], a: 0,
      cue: '「still has a」のあと、並べる形容詞。',
      line: 'he *still has a penchant for*… mid-century modern, *vintage-y*, kitschy stuff, like *artsy* stuff',
      said: '「相変わらず、昔風でキッチュな、アートっぽい物が好き」と言う。',
      mean: 'have a penchant for ～ ＝ 〜に目がない。still で好みは同じと分かる。',
      trap: 'modern だけだと今風に聞こえる。vintage と artsy が手がかり。',
      use: 'She has a penchant for old movies.（彼女は古い映画に目がない）' },

    // R fix: blind 60 %: "kitchen counter" was weak; now "a bar in Carly's old studio" (throwback to the studio, wrong
    //   object) competes. Line: whisper "to the studio", captions "to your studio"; the line now uses neither
    // why: old truck ← "made out of the back of a pickup truck" heard as his own truck from before; studio bar ←
    //   "throwback to the studio" heard, the "couch in the back of… a Mustang" missed
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'throwback', seg: [161.7, 172.3],
      stem: 'How is the pickup-truck bar linked to the old show?',
      choices: ['It recalls a couch in the back of a car', 'It recalls a bar in Carly’s old studio',
                'It’s built from Spencer’s old pickup'], a: 0,
      cue: 'バーの話のあと、「where」から。',
      line: 'a bar made out of the back of a pickup truck, which is kind of a *throwback*… where there was *a couch in the back of… a Mustang*',
      said: 'トラックの荷台のバーは、昔のスタジオの「車の後ろのソファ」を思い出させる。',
      mean: 'a throwback to ～ ＝ 〜を思い出させる物。車の後ろ、が共通点。',
      trap: 'made out of を「彼のトラック」と取りやすい。to のあとを聞く。',
      use: 'This song is a throwback to the 90s.（この曲は90年代を思い出させる）' },

    // R fix: blind 70 %: "another floor" was a filler; now the sincerity flip (they really expected the studio) competes,
    //   refuted by "It goes nowhere… we all know". Segment was 15.75 s; it now ends after "there's nothing there" (198.05 s)
    // why: turned into a bar ← the truck bar just before and "get rid of all the cheesy stuff" (104 s), read in-story;
    //   really expected ← the "uh-oh, we have a problem" taken at face value
    { id: 'h1', skill: 'humor', level: 'C1', point: 'stairs', seg: [183.8, 198.05],
      stem: 'Why is finding “nothing there” at the top of the stairs funny?',
      choices: ['They fake shock at what they just said', 'They really expected the old studio there',
                'Spencer turned the studio into his bar'], a: 0,
      cue: '少し前の「It goes…」という一言。',
      line: 'It goes *nowhere*. … We all know that you take these stairs to get up to the studio… *there’s nothing there*',
      said: '「この階段はどこにも続いてない」と言った直後に上り、「何もない！」と驚く。',
      mean: 'セットの階段が行き止まりだと知っていて、設定どおりに驚くふりをする遊び。',
      trap: 'uh-oh を本気の驚きと取りやすい。直前の It goes nowhere が答え合わせ。',
      use: 'Oh no, who could have seen that coming?（まさか、そんなの予想できた？）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'upstairs', seg: [187.0, 191.7],
      stem: 'Type the words: “So let’s ___, shall we?” (4 words)', answer: 'run on up there',
      cue: '「let’s」のあと、「shall we」の前。',
      line: 'So let’s *run on up there*, shall we?',
      said: '「じゃあ上まで行ってみようか」と誘う。',
      mean: 'run on up ＝ さっと上がる。on は「そのまま」の軽い感じ。shall we? で誘いになる。',
      trap: 'on と up がつながり「ラノナップ」と一語に聞こえる。there まで入れて4語。',
      use: 'Let’s head on over there.（あっちへ行ってみよう）' },

    // R fix: blind 75 %: "given up gum" was a filler; now the grown-ups reading ("as grown-ups now", 205 s) competes
    // why: walls too expensive ← the "updated", "fancy" set talk; too childish ← "the best part of doing a show with you
    //   guys as grown-ups now" leads into the gum talk
    { id: 'i3', skill: 'infer', level: 'B2', point: 'covid', seg: [216.25, 222.2],
      stem: 'Why will they never bring back sticking gum on the walls?',
      choices: ['Sticking food on things feels unclean now', 'Gum on the walls feels too childish now',
                'The new walls are too expensive to ruin'], a: 0,
      cue: '「world」の前の言葉と、最後の一文。',
      line: 'In a *post-COVID world*, we’re not ever going to do that again… we’re not gonna *stick food on anything*.',
      said: '「コロナ後の世界では、もう二度とやらない。食べ物を何かに貼るのはなし」。',
      mean: '衛生的に無理という理由。ガムを「食べ物」と言いかえて強めている。',
      trap: 'grown-ups の流れで「子どもっぽい」と取りやすい。理由は post-COVID。',
      use: 'Since COVID, I always carry hand gel.（コロナ以来、いつも消毒液を持ってる）' },

    // why: 500 ← "five" heard and the "thousand" lost after "like"; 50,000 ← fifty/five confusion
    { id: 'n1', skill: 'number', level: 'B1', point: 'gum', seg: [220.35, 227.4], keep: true,
      stem: 'How many pieces of gum were on the old gum wall by the end?',
      choices: ['500', '5,000', '50,000'], a: 1,
      cue: '「like」のあと、「pieces」の前。',
      line: 'it had like *5,000 pieces of gum* by the end',
      said: '「昔のガムの壁には、最後に5000個くらいガムがついてた」。',
      mean: 'like は「〜くらい」。だいたいの数として言っている。',
      trap: 'like のあとは数がぼやけやすい。thousand の「サウ」を拾えば桁が分かる。',
      use: 'It took like two hours.（2時間くらいかかった）' },

    // R fix: blind 85 %: the key was the only balanced choice; now two "Upgraded" readings differ only on the "but"
    // why: fun touches gone ← "no more of the monkeys" and "get rid of all the cheesy stuff" (104 s), the "but… still
    //   some whimsy" missed; mostly the same ← "it's like nothing has changed" at the end (318 s) and the old stools
    { id: 'g2', skill: 'gist', level: 'B2', point: 'look', seg: [255.0, 274.95],
      stem: 'How do they sum up the apartment’s new look?',
      choices: ['Upgraded, but with some fun touches kept', 'Upgraded, but with the old fun touches gone',
                'Mostly the same as before, just tidier'], a: 0,
      cue: '「monkeys」のあとの「but」と、「a little…」のくり返し。',
      line: 'You really *upgraded*… But there’s *still some whimsy*… it’s *a little old, a little new*.',
      said: '「格上げしたね」「でも遊び心は残ってる」「少し古くて、少し新しい」と話す。',
      mean: '大人っぽくなったが、ふざけた飾りも残っている。whimsy ＝ 遊び心。',
      trap: 'no more monkeys だけだと楽しい物が消えたと思いやすい。but のあとを聞く。',
      use: 'A little old, a little new. Love it.（少し古くて、少し新しい。大好き）' },

    // why: above the fridge ← "used to be… above the refrigerator" is said first; beside the stairs ← the stairs part of
    //   the tour just before (186 s)
    { id: 'd5', skill: 'detail', level: 'B1', point: 'bike', seg: [275.0, 282.85],
      stem: 'Where is the bike now?',
      choices: ['Above the elevator', 'Above the fridge', 'Beside the stairs'], a: 0,
      cue: '「now there’s」のあと。',
      line: 'there used to be a bike *above the refrigerator*… *now* there’s a beach cruiser *above the elevator*',
      said: '「前は冷蔵庫の上に自転車。今はエレベーターの上にある」。',
      mean: 'used to be ＝ 昔は。now で今の場所を言う。',
      trap: 'elevator と refrigerator は語尾が似ている。used to be と now を分けて聞く。',
      use: 'Now it’s by the window instead.（今はかわりに窓のそばにある）' },

    // R fix: blind 80 %: the distractors were thin; now a wrong-target near miss (teasing the other) competes. Its line
    //   names the old spot, so it now reveals `bike` (d5)
    // why: crew ← a real wh-question about the old set; teasing the other ← the reply "You're still doing it" teases,
    //   so the question can sound like a jab too
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'fridge', reveals: ['bike'], seg: [282.3, 288.05],
      stem: 'What is the speaker doing with the question that starts “who puts…”?',
      choices: ['Mocking the old spot as one nobody would pick', 'Asking who on the crew picked the old spot',
                'Teasing the other for picking the new spot'], a: 0,
      cue: '答えを待たずに続く「This makes way more sense」。',
      line: 'when you think about it, *who puts a bicycle above the fridge*? This makes *way more sense*.',
      said: '「冷蔵庫の上に自転車を置く人なんている？こっちの方がずっと筋が通る」。',
      mean: '答えを求めない質問（反語）。「そんな人いない」を疑問の形で言う。',
      trap: 'who で始まるので本当の質問と取りやすい。答えを待たず意見が続いたら反語。',
      use: 'Who eats pizza with a fork?（ピザをフォークで食べる人なんている？）' },

    // R fix: blind 65 %; its choices named both bike spots, so it now reveals `bike` (d5). The reason reading echoes "it
    //   looks cool" (294 s, after the segment)
    // why: taking it back ← "I mean" as a self-repair, back to the fridge; adding a reason ← "I mean" heard as "because",
    //   and the elevator spot was just praised
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['abnormal', 'bike'], seg: [287.6, 291.7],
      stem: 'After “This makes way more sense”, what does “I mean” lead into?',
      choices: ['Widening it: any bike on a wall is odd', 'Taking it back: the fridge spot was fine',
                'Adding a reason: the elevator spot looks cool'], a: 0,
      cue: '「I mean」のあと、「isn’t it?」まで。',
      line: '*I mean*, mounting a bicycle on the wall is *just weird*, isn’t it?',
      said: '「こっちの方が筋が通る。というか、自転車を壁にかけること自体が変じゃない？」',
      mean: 'この I mean は「というか」。話を一段広げている。',
      trap: 'I mean を言い直しと取ると「冷蔵庫に戻す」に引かれる。後ろが壁全般の話かを聞く。',
      use: 'It’s fine. I mean, it’s not perfect.（いいよ。というか、完ぺきではないけど）' },

    // R fix: blind 75 %: "the old fridge is still there" was a filler; now "the bike is still above the fridge, too"
    //   (still + fridge), refuted by "instead of above the fridge"
    // why: still above the fridge ← "fridge" was the last place named before "still"; same complaint ← "doing it" taken
    //   as "saying it" (still making that point)
    { id: 'i2', skill: 'infer', level: 'C1', point: 'abnormal', seg: [287.6, 295.4],
      stem: 'What is the reply “You’re still doing it, ten years later” pointing out?',
      choices: ['The set still has a bike on a wall, just moved', 'They have made that same complaint for years',
                'The bike is still above the fridge, too'], a: 0,
      cue: '直前の質問と、「it」が指すもの。',
      line: 'mounting a bicycle on the wall is just weird, isn’t it? — *You’re still doing it*, ten years later.',
      said: '「壁に自転車なんて変だよね？」に、「10年たってもまだやってるじゃん」と返される。',
      mean: 'it ＝ 壁に自転車をかけること。場所を変えただけで続けている、と突っこむ。',
      trap: 'doing it を「同じ文句を言う」と取りやすい。it は直前の文の中身を指す。',
      use: 'You say that, but you’re still doing it.（そう言うけど、まだやってるじゃん）' },

    // R fix: blind 50 % and right: "doing it" was the stock phrase among three; a 2 × 2 grid (doing/into × it/that)
    //   leaves both halves to the ear
    // why: into it ← "doing it" with the g dropped and a soft t ≈ "doo-in-it", close to "into it", which also makes sense
    //   (still likes it); doing that ← same meaning, only the weak "it" vs "that" decides; into that ← both slips at once
    { id: 's1', skill: 'sound', level: 'B2', point: 'abnormal', seg: [291.7, 295.4],
      stem: 'Fill the gap: “You’re still ___, ten years later.”',
      choices: ['doing it', 'into it', 'doing that', 'into that'], a: 0,
      cue: '「still」のあと、短く弱い2語。',
      line: 'You’re still *doing it*, ten years later.',
      said: '「10年たっても、まだやってる」。doing it が「ドゥーイニッ」とつながる。',
      mean: 'doing の g は落ち、it の t もほぼ消えて、2語が一つの音になる。',
      trap: 'into it（まだ好き）も意味は通る。直前の「壁に自転車は変」から判断する。',
      use: 'Are you still doing yoga?（まだヨガやってる？）' },

    // R fix (C2 rewrite 1): blind 70 %: the key carried its own reason ("right after they fumble"); the choices are now
    //   bare targets of the same length
    // why: honest pride ← sincerity flip: "still got it" is a real boast phrase, and "nothing has changed" follows;
    //   doubters ← scope shift: "it" read as their old touch, aimed at people who doubted the reboot
    // anchor: 305.8–313.8 s "this has been… this has been… this has been Miranda and Jerry… for the tour" (a stammered
    //   sign-off, in both sources), then 315.8 s "Still got it"
    { id: 'c1', skill: 'humor', level: 'C2', point: 'stillgot', seg: [305.2, 317.6],
      stem: 'In “Still got it”, who is the joke on?',
      choices: ['Themselves, after a clumsy sign-off', 'Nobody; it’s real pride in the tour',
                'Doubters who said they’d lost it'], a: 0,
      cue: '直前のしめくくりの言い方と、その直後の一言。',
      line: 'this has been… this has been… this has been Miranda and Jerry… — *Still got it*.',
      said: 'しめの言葉で「お送りしたのは…」と何度もつっかえ、終わった直後に「腕は落ちてないね」。',
      mean: 'つっかえた直後の自慢は、自分たちへのツッコミ。さえない場面に決めぜりふを当てる笑い。',
      trap: 'still got it は本気の自慢にも使う。直前がうまくいったかどうかで、本気か冗談かが決まる。',
      use: 'Tripped on the stairs. Still got it!（階段でつまずいた。腕は健在！）' },
  ]
};
