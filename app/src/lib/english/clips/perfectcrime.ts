// “Dwight's perfect crime  - The Office US #shorts” (the official The Office channel, BEST OF SEASON 5): a talking
// head in which Dwight tells his “perfect crime”: a midnight theft at Tiffany's, the owner's daughter, and the woman he
// sends to the wrong place twice before he stashes the chandelier in Berlin.
// Segments from the captions, words from whisper (2026-11-16). The two sources agree word for word. Speech is
// continuous (94 %), so most segment edges sit in 0.1–0.3 s gaps between sentences, not 0.5 s. Untested: 14.8–16.0 s
// (“We make love all night”: kept out of every segment but the whole-clip gist g1) and 31.6–34.8 s (the Trocadero, a
// world-knowledge place).
// REVIEW 2026-11-16: pass 4, fix 15, drop 0, new 0; ear checks 0
//   Open: the clip is 43 s with 19 items, so every scene line sits in several items; play 2 repeats segments, not
//   items.
// EAR CHECK: none (no key rests on a line where the sources differ, on a speaker, on a stress, or on tone alone)
import type { Clip } from '../types.ts';

export const perfectCrime: Clip = {
  id: 'perfectcrime', video: 'BfXdByo3XWw', title: 'Dwight\'s perfect crime', dur: 45, wpm: 205,
  band: 'fast', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 % and right): the key was the only repeated pattern, and "a grown son" is half true (the
    //   postcard). Now all three are patterns built from what's heard.
    // why: police ← cops, uniforms and "chief of police" are all heard, so the police seem to keep coming back; waiting
    //   till they meet ← "meet me in Mexico… meet me in Paris" heard as plans that come off
    { id: 'g1', skill: 'gist', level: 'B2', point: 'pattern', reveals: ['mexico', 'interesting', 'ending'], seg: [0, 43.5],
      stem: 'Beyond the theft, what does most of Dwight’s story turn out to be about?',
      choices: ['Leaving Tiffany behind, more than once', 'Getting away from the police, more than once',
                'Keeping Tiffany waiting till they meet again'], a: 0,
      cue: '「meet me」と言ったあと、彼が実際にどこへ行くか。',
      said: '盗みの話は最初の数秒だけ。あとはティファニーに「会おう」と言っては、別の場所へ行く話が続く。',
      mean: '「完全犯罪」と言いながら、中身は彼女を二度置き去りにする話になっている。',
      trap: '警察は一度出るだけ。「会おう」の約束は守られない。くり返される流れが大意。',
      use: 'The point of the story is…（話の要点は…）' },

    // R fix: V2 (blind 60 % and right): in a crime story, "smashes" and "first job" left the key as the only way in.
    //   Now all three are heist entries, and only "break into" tells them apart.
    // why: hides inside ← "at midnight" heard as staying in after closing; help from inside ← "into" heard as being
    //   let in (an inside job)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'breakin', seg: [1.4, 5.45],
      stem: 'In his first step, what does Dwight say he does at Tiffany’s?',
      choices: ['Gets in without anyone letting him', 'Hides inside until the store closes',
                'Gets in with help from someone inside'],
      a: 0,
      cue: '「Tiffany’s at midnight」の直前、動詞のかたまり。',
      line: 'I *break into* Tiffany’s at midnight.',
      said: '「真夜中にティファニーの店に忍び込む」と話し始める。',
      mean: 'break into ＋場所 ＝ 押し入る・勝手に入り込む。真夜中という時間とも合う。',
      trap: '隠れて待つ、手引きで入るは別の言い方。break into は外から勝手に入ること。',
      use: 'Someone broke into my car last night.（昨夜、車上荒らしにあった）' },

    // R fix: V2 (blind 70 % and right): "too hard to crack" was a filler, so the key was the only speech move. Now
    //   all three are moves a speaker makes with a question.
    // why: undecided ← the thinking-aloud reading (考え中の独り言); checking the listener ← a question to camera heard
    //   as one for the interviewer (確認の問いかけ)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'vault', reveals: ['chandelier'], seg: [3.6, 8.0],
      stem: 'Right after “Tiffany’s at midnight”, why does Dwight ask himself a question?',
      choices: ['To set up a surprise in his own answer', 'To show he is still weighing the vault',
                'To check the interviewer is following'], a: 0,
      cue: '質問のすぐあと、誰が答えるか。',
      line: 'Do I go for the vault? *No.* I go for the chandelier.',
      said: '「金庫を狙う？いや。シャンデリアだ」と自分で問い、自分で答える。',
      mean: '自問自答で「普通は金庫」という予想を立て、それを裏切って意外さを出す話し方。',
      trap: '迷っても、相手に聞いてもいない。間を置かずに自分で答える質問は、意外な答えの前振り。',
      use: 'Do I give up? No. I try again.（あきらめる？いや、もう一回やる）' },

    // why: vault ← "Do I go for the vault?" heard without the "No"; necklace ← "priceless" plus a jewelry store
    { id: 'd1', skill: 'detail', level: 'B1', point: 'chandelier', seg: [3.6, 8.0],
      stem: 'What does Dwight choose to take from the store?',
      choices: ['The chandelier itself', 'Whatever is in the vault', 'A priceless necklace'], a: 0,
      cue: '「No.」のあと、もう一度 go for。',
      line: 'No. I go for the *chandelier*. It’s priceless.',
      said: 'シャンデリアを狙う。値段がつけられないほど貴重だから。',
      mean: 'go for ＝ 狙う。priceless は「値段がない」でなく「計り知れない価値」。',
      trap: 'vault も聞こえるが、すぐ No と打ち消す。priceless はシャンデリアの説明。',
      use: 'I’ll go for the cheaper one.（安いほうにするよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'down', seg: [7.6, 10.2],
      stem: 'Type what he says: “___, a woman catches me.” (5 words)', answer: "as i'm taking it down",
      cue: '「priceless」のあと、文の始め。語がつながる。',
      line: '*As I’m taking it down*, a woman catches me.',
      said: '「それを取り外している最中に、女に見つかる」。',
      mean: 'as ＝ 〜している最中に。take it down ＝ 高い所から降ろす・取り外す。',
      trap: 'taking‿it‿down は「テイキニッダウン」とつながり、it が消えたように聞こえる。',
      use: 'As I was leaving, it started to rain.（出ようとしたら雨が降ってきた）' },

    // why: guard ← a woman who catches a thief at midnight fits a night guard; police ← "the cops come" next
    { id: 'd2', skill: 'detail', level: 'B2', point: 'tiffany', seg: [9.8, 14.7],
      stem: 'Who is the woman who catches Dwight?',
      choices: ['The owner’s daughter', 'A night-shift guard', 'A police officer'], a: 0,
      cue: '「She tells me to stop」のあと、二つの短い文。',
      line: 'It’s *her father’s business*. She’s *Tiffany*.',
      said: '「やめて、父の店なの」と言われる。彼女の名前は店と同じティファニー。',
      mean: '父の店で、店名と同じ名前。二文を合わせて、オーナーの娘だと分かる。',
      trap: '真夜中の店なので警備員を想像しやすい。警察は翌朝の話。business は「店・会社」。',
      use: 'It’s a family business.（家族でやっている店です）' },

    // R fix: V2/K4/§9.5 (blind 50 % and right): "and one of their" doesn't fit the gap and "in all of their" is
    //   absurd. Now three that fit, differing only in the weak last word.
    // why: the ← weak "their" sounds like "the"; those ← "th-" plus a vowel caught, the end lost
    { id: 's1', skill: 'sound', level: 'C1', point: 'uniform', seg: [16.0, 19.2],
      stem: 'Fill the gap: “I escape ___ uniforms.”',
      choices: ['in one of their', 'in one of the', 'in one of those'], a: 0,
      cue: '「I escape」のあと、とても速い4語。',
      line: 'and I escape *in one of their* uniforms.',
      said: '「警官の制服を一着着て逃げる」。4語がひと続きで「インワナヴゼア」に近い。',
      mean: 'in ＋服 ＝ 〜を着て。their は cops を受ける。',
      trap: 'their は弱く the に近くなる。前の文の cops を覚えておくと「彼らの」と分かる。',
      use: 'She came down in one of my shirts.（彼女、僕のシャツを着て下りてきた）' },

    // R fix: V2 (blind 55 % and right): "really doing" in the stem pointed at the only trick. The stem now asks for
    //   his plan, and all three choices are plans.
    // why: police ← he has just escaped the cops, so a hideout makes sense; new life ← "meet me" heard as a real plan
    //   for the two of them
    { id: 'i1', skill: 'infer', level: 'C1', point: 'mexico', seg: [19.05, 22.95],
      stem: 'When Dwight tells her to meet him in Mexico, what is his plan?',
      choices: ['To be somewhere else when she arrives', 'To hide where the police won’t look',
                'To start a new life there with her'], a: 0,
      cue: '「Mexico」のあとの but と、行き先。',
      line: 'I tell her to meet me in Mexico, *but I go to Canada*.',
      said: '「メキシコで会おう」と言いながら、自分はカナダへ行く。',
      mean: '約束の場所とは別の国へ行く。最初から彼女をまく計画だったと分かる。',
      trap: '「会おう」だけ聞くと二人の計画に思える。but のあとが本当の行動。約束と行動を比べる。',
      use: 'He said he’d come, but he never did.（来ると言ったのに、来なかった）' },

    // R fix: C8: the line ran three consecutive sentences; trimmed to the two the key needs.
    // why: does trust ← "don't" is weak and its t is lost; police in Mexico ← "the cops come" just before, and
    //   "cold" invites "the heat"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'canada', reveals: ['mexico', 'cold'], seg: [19.05, 25.1],
      stem: 'Why does Dwight go to Canada and not Mexico?',
      choices: ['He doesn’t trust her, and he likes the cold', 'He does trust her, but he likes the cold more',
                'The police are in Mexico, and he hates the heat'], a: 0,
      cue: '「Canada」のあと、短い文が二つ。',
      line: '…I go to Canada. *I don’t trust her.* Besides, *I like the cold*.',
      said: '「メキシコで会おうと言ってカナダへ行く。信用してないし、寒いのが好きだから」。',
      mean: '理由は二つ。信用していないことと、寒さが好きなこと。',
      trap: 'don’t の t は消えやすいが、「ドン」の n は残る。trust her は「トラスター」とつながる。',
      use: 'I don’t trust that website.（あのサイトは信用できない）' },

    // R fix: V2 (blind 65 % and right): the key was the only mechanism; the others were plain readings. Now each
    //   choice names a mechanism.
    // why: the real reason ← "Besides" heard as "actually" (本当は), so the cold replaces trust; a dig at her ← cold =
    //   冷たい人, right after "I don't trust her"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'cold', reveals: ['canada'], seg: [20.75, 25.1],
      stem: 'Why is the reason Dwight adds after “I don’t trust her” funny?',
      choices: ['He adds a small taste to a grave reason', 'He admits the cold is the real reason',
                'He calls Tiffany cold, as a dig at her'], a: 0,
      cue: '「Besides」のあと、理由の大きさ。',
      line: 'I don’t trust her. *Besides, I like the cold.*',
      said: '「信用できない。それに寒いのが好きだし」と付け足す。',
      mean: '逃げる先を決める重い理由に、好みの小さな理由を並べる。その落差がおかしい。',
      trap: 'Besides は理由の追加で、本音の打ち明けではない。the cold は「寒さ」で、冷たい人のことでもない。',
      use: 'Besides, I need the exercise.（それに、運動にもなるし）' },

    // R fix: S4: the seg was 2.1 s (under 3 s); it now runs 24.75–27.95 s, to the end of "I have a son".
    // why: 13 ← thirteen/thirty, told apart only by stress; 3 ← only "thir-" caught; 40 ← "-ty" heard, the first part
    //   lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'thirty', seg: [24.75, 27.95], keep: true,
      stem: 'How long after Canada does the postcard come?',
      choices: ['3 years', '13 years', '30 years', '40 years'], a: 2,
      cue: '「years later」の前の数字。',
      line: '*Thirty years* later, I get a postcard.',
      said: '「30年後、はがきが届く」。',
      mean: 'thirty は前を強く読み、t は弾んで「サーディ」に近い。thirteen なら後ろの teen が強く長い。',
      trap: '-teen と -ty は強勢の位置で聞き分ける。語の終わりが短く弱ければ -ty。',
      use: 'Twenty years later, we met again.（20年後、また会った）' },

    // R fix: V2 (blind 50 % and right): "returns the prize" made the Paris choice unlike Dwight. It now differs from
    //   the key in one part only.
    // why: Paris ← "meet me in Paris" heard as the plan that happens; son catches him ← the chief of police is set up
    //   just before
    { id: 'g2', skill: 'gist', level: 'B2', point: 'ending', reveals: ['showup', 'stash'], seg: [26.95, 43.5],
      stem: 'How does Dwight’s story end?',
      choices: ['He leaves Tiffany waiting and keeps the prize', 'He meets Tiffany in Paris and keeps the prize',
                'His son, the police chief, finally catches him'], a: 0,
      cue: '「Paris」のあと、本当に行く場所。',
      line: '*I don’t show up.* I go to Berlin. That’s where I *stash the chandelier*.',
      said: 'パリで会おうと言いながら行かず、ベルリンへ。そこにシャンデリアを隠してある。',
      mean: '彼女はまた置き去り、盗んだ物は手元に残る。彼にとっての「完璧」な結末。',
      trap: '警察署長の息子は話に一度出るだけで、そのあと出てこない。結末は最後の二文で決まる。',
      use: 'And that’s how it ended.（で、そういう結末だった）' },

    // R fix: S4: the seg ran 27.5 s (16.0–43.5), over 15 s for a non-gist. It now starts at "This is where the story
    //   gets interesting", so "the cops come" is out; the "nobody finds out" distractor became "I sell the prize",
    //   which "stash" refutes. Moved to clip order.
    // C2: a plain-English paraphrase (cf. g2)
    // anchor: 38.7–42.9 s "I don't care. I don't show up. I go to Berlin. That's where I stash the chandelier" (kept,
    //   not sold; the woman who waited is left behind)
    // why: sell, unseen ← the usual sense of "perfect crime" (完全犯罪 = never found out, cash in); win her ← "meet me
    //   in Paris" and her years of waiting heard as a love story
    // retired: never drawn: its point is g2's and g1 reveals it, and a gist always leads; back with a point of its own
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'ending', reveals: ['showup', 'stash', 'loyal', 'interesting'],
      seg: [29.5, 43.5], retired: true,
      stem: 'Which plain-English version keeps what makes the crime “perfect” for Dwight?',
      choices: ['“I keep the prize, and I need nobody.”', '“I sell the prize, and nobody finds out.”',
                '“I win her, and we get away together.”'], a: 0,
      cue: 'パリの約束のあと、最後の四つの文。',
      said: '待つ彼女に「どうでもいい」と言ってすっぽかし、ベルリンへ。そこにシャンデリアを隠す。',
      mean: '日本語の「完全犯罪」はばれないことだが、彼の「完璧」は、宝を手元に置き、誰にも頼らないこと。',
      trap: 'perfect crime を「ばれずに売りさばく」と取りやすい。言葉の意味は、話の結末で決める。',
      use: 'For me, the perfect day is staying home.（私にとって最高の日は家にいること）' },

    // R fix: S4: the seg ran 16.6 s; it now starts at "This is where…" (29.5 s). The son is no longer heard in
    //   the seg, which still refutes the son distractor: nothing after 29.5 s mentions him.
    // C2: what the line rewrites (cf. a2)
    // anchor: 29.7–42.9 s after "This is where the story gets interesting", every sentence is Tiffany waiting and
    //   him not coming ("She's been waiting for me all these years… I don't care. I don't show up. I go to Berlin."); the
    //   son is never mentioned again, and "stash" means he still has the chandelier
    // why: son ← "I have a son… chief of police" comes just before the seg (and in the full watch), so the
    //   "interesting" part sounds like his; the chandelier ← "stash the chandelier" heard as getting it back
    // retired: with nt2: one C2 alone is under the native tier’s 2; back with nt2
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'interesting', reveals: ['showup', 'loyal'], seg: [29.5, 43.5],
      retired: true,
      stem: 'After “This is where the story gets interesting”, what does Dwight count as interesting?',
      choices: ['Leaving a woman who waited for him for years', 'Meeting the son he has never known at last',
                'Getting back the chandelier he had lost'], a: 0,
      cue: '「interesting」のあと、実際に語られる中身。',
      line: 'This is where the story gets interesting. … She’s been waiting for me all these years… *I don’t show up.*',
      said: '「ここから面白くなる」のあとは、待つ彼女に会いに行かない話だけ。息子は二度と出ない。',
      mean: '彼の「面白い」は、一途な相手をすっぽかす場面。普通は感動の再会が来る所を裏切るのが楽しみ。',
      trap: '直前の息子の話につなげたくなる。「ここから」の宣言は、実際に語られた中身で確かめる。',
      use: 'Here’s the best part.（ここからがいいところ）' },

    // R fix: V2 (blind 70 % and right): "nervous the police might hear" is refuted by nothing in the words and was a
    //   filler. Now the distractors are regret and shyness, both refuted by what he says.
    // why: uneasy ← a confession to camera read as regret (告白＝反省); shy ← a wild story told to camera heard as
    //   embarrassing (照れ)
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'pride', reveals: ['care'], seg: [29.65, 43.5],
      stem: 'Overall, how does Dwight seem to feel about his own story?',
      choices: ['Pleased with how well it all works out', 'Uneasy about how he treats Tiffany in it',
                'Shy about telling such a wild story'], a: 0,
      cue: '話の途中で、自分の話をどう紹介するか。',
      line: '*This is where the story gets interesting.* … I don’t care.',
      said: '「ここから面白くなる」と自分で盛り上げ、彼女の話にも「どうでもいい」と言う。',
      mean: '自分の作った話に満足し、楽しんで語っている。「完全犯罪」と呼ぶのもその表れ。',
      trap: 'カメラへの告白は反省や照れに聞こえやすいが、自分で話を盛り上げている。言葉で判断する。',
      use: 'I’m pretty proud of that one.（あれはけっこう自信作）' },

    // R fix: V2 (blind 50 % and right): "helping the police" was a filler. Both distractors now come from missing
    //   "never".
    // why: then found someone ← "been waiting… all these years" heard, then "taken another lover" without "never";
    //   got over ← the same miss, read as the end of it
    { id: 'i2', skill: 'infer', level: 'B2', point: 'loyal', seg: [35.0, 38.62],
      stem: 'From the two lines about Tiffany in Paris, what do we learn about her?',
      choices: ['She has waited for him and no one else', 'She waited for years, then found someone',
                'She got over him a long time ago'], a: 0,
      cue: '二つの文の、時間の長さと否定の語。',
      line: 'She’s *been waiting* for me all these years. She’s *never taken another lover*.',
      said: '「ずっと私を待っていた。ほかの恋人も作らなかった」。',
      mean: '長い年月、一途に待ち続けた。物語なら、ここで再会して結ばれる場面。',
      trap: 'never を聞き逃すと「別の恋人がいた」になる。否定の語は短く速いので、文の中ほどを聞く。',
      use: 'I’ve been waiting all week for this.（今週ずっとこれを楽しみにしてた）' },

    // R fix: V2 (blind 50 % and right): "worried it is a trap" was a filler. The new distractor is moved-but-firm.
    // why: guilty ← the Japanese frame: after a sad, loyal story, remorse is expected; touched ← "I don't care" heard
    //   as "it doesn't matter" (それでも行かない), not as no feeling
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'care', reveals: ['loyal'], seg: [35.0, 39.38],
      stem: 'After hearing how Tiffany waited, how does Dwight say he feels?',
      choices: ['Not moved by it at all', 'Touched, but it changes nothing', 'Guilty, though he hides it'], a: 0,
      cue: '待っていた話のすぐあと、三語の短い文。',
      line: 'She’s never taken another lover. *I don’t care.*',
      said: '一途に待っていた話のすぐあと、「どうでもいい」と言い切る。',
      mean: '感動も後悔もない。彼女の気持ちに、まったく心を動かされていない。',
      trap: '悲しい話のあとは反省を期待しがちだが、言葉ははっきり「気にしない」。隠す様子もない。',
      use: 'Honestly, I don’t care what they think.（正直、どう思われてもいい）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'showup', reveals: ['care'], seg: [38.62, 41.05],
      stem: 'Type what he says after “I don’t care”: “___. I go to Berlin.” (4 words)', answer: "i don't show up",
      cue: '「I don’t care」のすぐあと、短い四語。',
      line: 'I don’t care. *I don’t show up.* I go to Berlin.',
      said: '「行かない。ベルリンへ行く」とまたすっぽかす。',
      mean: 'show up ＝ 約束の場所に現れる。ここでは「すっぽかす」。',
      trap: 'don’t の t と show がつながり「ドンショウ」。up は弱いが、show up で一つの意味。',
      use: 'He didn’t show up for work today.（彼、今日は仕事に来なかった）' },

    // R fix: V2 (blind 50 % and right): nobody smashes a priceless chandelier (a filler). The new distractor carries
    //   the story's leaving-behind pattern.
    // why: cash ← stash/cash share their ending; leaves it ← he has just left Tiffany behind, so "where I ___ the
    //   chandelier" sounds like another leaving
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'stash', seg: [39.95, 43.5],
      stem: 'At the very end, what does Dwight say he does with the chandelier?',
      choices: ['Hides it away to keep it', 'Sells it off for quick cash', 'Leaves it behind for good'], a: 0,
      cue: '「That’s where I」のあとの動詞。',
      line: 'That’s where I *stash* the chandelier.',
      said: '「そこにシャンデリアを隠してある」で話が終わる。',
      mean: 'stash ＝ こっそりしまい込む、隠しておく。お金やお菓子にもよく使う口語。',
      trap: 'stash は cash と終わりの音が同じ。置いていくのでもなく、後で使うためにしまうこと。',
      use: 'I keep a stash of snacks at my desk.（机にお菓子を隠してある）' },
  ]
};
