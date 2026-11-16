// REVIEW 2026-11-16: pass 6, fix 14, drop 0, new 0; ear checks 0
// OPEN: w1 (who promises) stays guessable for anyone who knows Joey is the big eater; the surname settles it from the
// audio, so it's kept as the clip's only who item.
// “Monica Isn't Making a Turkey | Friends” (the official Friends channel, Best of Season 8): Monica says she won't
// cook a turkey for so few eaters, and Joey talks her round by promising to eat it all himself.
// Segments from the captions, words from whisper (2026-11-16). Speakers aren't named in the audio except Phoebe (by
// Monica) and Joey (“I'm a Tribbiani”), so stems say “the reply” where the voice alone would tell. Captions put
// “delicious” at 14.0 s; whisper has it at ≈12.5 s with the laugh after, so h1's segment runs to 14.8. No predict item:
// the one clean cut (“is like, like…”) gives the comparison away from its own form.
// EAR CHECK: none. Both sources agree on every key's words; w1's speaker is settled by turn-taking (the promiser
// answers “You're telling me…?” with “That's right, cuz I'm a Tribbiani”).
import type { Clip } from '../types.ts';

export const noturkey: Clip = {
  id: 'noturkey', video: '0X46OBRIQQM', title: 'Monica Isn\'t Making a Turkey', dur: 86, wpm: 224, band: 'fast',
  tags: ['家', '友だち'],
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: blind 60 % — "secret" was a filler; both distractors are now coherent openings (V2/K3)
    // why: "would mind" ← the Japanese frame of consulting the group first; "unless someone helps" ← a hedge read into
    // "just so you know", the usual lead-in to a bargain
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'justso', seg: [0, 3.6],
      stem: 'How does Monica open the scene with her first sentence?',
      choices: ['She tells them about a plan she has already settled',
                'She asks if anyone would mind her skipping a dish',
                'She hints she may skip a dish unless someone helps'], a: 0,
      cue: '最初の一文、本題の前に付いた短い前置き。',
      line: '*Just so you know*, I’m not going to make a turkey this year.',
      said: '「一応言っておくけど、今年はターキーは作らないから」と切り出している。',
      mean: 'just so you know は相談ではなく、決めたことを先に知らせる前置き。',
      trap: '日本語なら「どうかな？」と相談しそうな場面だが、ここは通知。手伝いの条件も付けていない。',
      use: 'Just so you know, I’ll be late.（一応言っておくと、遅れるよ）' },

    // R fix: blind 65 % — the key was the one coherent reason; "costs too much" now names the same three people (V2/K3)
    // why: "costs too much" ← "worth it" + "just three people" heard, reason swapped (cost vs work); "Phoebe asked" ←
    // Phoebe is named first and speaks up for turkeys
    { id: 'g2', skill: 'gist', level: 'B2', point: 'why', reveals: ['worth', 'three', 'phoebe'], seg: [0, 39.8],
      stem: 'What is Monica’s main reason for skipping the turkey?',
      choices: ['Few would eat it, so it isn’t worth the work', 'A whole bird costs too much for just three people',
                'Phoebe has asked her not to cook one this year'], a: 0,
      cue: '食べない人を数えたあと、「Anyway」からのまとめ。',
      line: 'it just *doesn’t seem worth it* to make a whole turkey for just three people',
      said: '食べない人が多く、三人のためにターキーを丸ごと作るのは割に合わない、と言う。',
      mean: '人数と手間の話。最後に「大変なんだから」と手間を強調している。',
      trap: '少人数＝お金の話と取りやすいが、口にしているのは手間。フィービーは頼んではいない。',
      use: 'It’s not worth the trouble.（そこまでする価値はないよ）' },

    // R fix: blind 60 % — "does" was the only positive choice, and the scene (skipping turkey) rules it out; all four
    // are now negatives, so only the vowel and the tense tell them apart (V2)
    // why: didn't ← /ʌ/ and /ɪ/ blur in a fast weak syllable, and "this year" invites a past reading; won't ← a refusal
    // reading; can't ← another short negative that fits skipping the turkey
    { id: 's1', skill: 'sound', level: 'B1', point: 'phoebe', seg: [3.2, 6.2],
      stem: 'Fill the gap: “Well, Phoebe ___ eat turkey.”',
      choices: ['doesn’t', 'didn’t', 'won’t', 'can’t'], a: 0,
      cue: '「Phoebe」のすぐあと、短く弱い一語。', line: 'Well, Phoebe *doesn’t* eat turkey.',
      said: '「だってフィービーはターキーを食べないし」と理由を挙げ始める。',
      mean: 'doesn’t は「ダズン」と短く、最後の t はほぼ消える。習慣の話なので現在形。',
      trap: '速いと didn’t や can’t と紛れやすい。母音と、習慣の話かどうかで判断。',
      use: 'He doesn’t eat meat.（彼はお肉を食べないの）' },

    // R fix: blind 55 % — "admits they're beautiful" didn't explain a laugh; it's now "agrees, then adds they taste
    // good", which also ends on eating (V2/K3)
    // why: "agrees" ← "No, they're not" is missed, so "delicious" sounds like an add-on to Phoebe's praise; "insults
    // Phoebe" ← they're heard as you're
    { id: 'h1', skill: 'humor', level: 'C1', point: 'delicious', seg: [6.2, 14.8],
      stem: 'Why does the audience laugh at the reply to Phoebe’s praise of turkeys?',
      choices: ['It runs turkeys down, then ends on a reason to eat them',
                'It agrees with Phoebe, then adds that they taste very good',
                'It turns the insults around onto Phoebe herself'], a: 0,
      cue: '「No」のあと、悪口が並ぶ最後の一語。',
      line: 'No, they’re not. They’re *ugly and stupid and delicious*.',
      said: '「美しくない、醜くてバカで、おいしい」と言い返している。',
      mean: '悪口を並べたあと、最後だけ「おいしい」。食べる理由で締めるのがオチ。',
      trap: 'they’re を you’re と聞くと、フィービーへの悪口に聞こえる。並びの最後の語に注目。',
      use: 'It’s cheap, fast, and delicious.（安くて早くておいしい）' },

    // why: "still on a diet" ← said right before, about Will; "can't stand poultry" ← said right after, about Rachel
    { id: 'd1', skill: 'detail', level: 'B1', point: 'chandler', reveals: ['poultry', 'phoebe'], seg: [14.5, 21.9],
      stem: 'What reason does Monica give for Chandler?',
      choices: ['He doesn’t eat Thanksgiving food', 'He is still on a strict diet', 'He can’t stand poultry right now'], a: 0,
      cue: '名前が三つ続く。二つ目の名前のあと。',
      line: 'Will’s still on a diet, *Chandler doesn’t eat Thanksgiving food*',
      said: 'ウィルはダイエット中、チャンドラーは感謝祭の料理を食べない、と一人ずつ挙げる。',
      mean: '食べない人を数えて、ターキーを作る意味がないと説明している。',
      trap: '理由が三つ続けて並ぶので、隣の人の理由と入れ替わりやすい。名前と理由を組で聞く。',
      use: 'She doesn’t eat spicy food.（彼女は辛いものを食べないの）' },

    // R fix: blind 70 % — the stem quoted the phrase under test, so knowing "aversion" answered it; the stem now names
    // the moment, and the choices are three parallel conditions (S2/V2/K5)
    // why: "allergy" ← a medical reading of aversion; "a diet" ← the diet mentioned just before (Will's)
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'poultry', seg: [17.95, 26.1],
      stem: 'When Monica gets to Rachel, what does she say Rachel has?',
      choices: ['A strong dislike of chicken and turkey', 'An allergy to chicken and turkey',
                'A diet with no chicken or turkey'], a: 0,
      cue: 'すぐあとに出てくる、部屋を出た話がヒント。',
      line: 'Rachel’s having her *aversion* to poultry',
      said: 'レイチェルは今、鶏肉や七面鳥がだめな時期だ、と言う。',
      mean: 'aversion ＝ 強い嫌悪感。poultry は鶏や七面鳥。having で「今そういう時期」。',
      trap: '体の反応ならアレルギー、直前の diet なら食事制限に引かれる。続く例で確かめる。',
      use: 'I have an aversion to crowds.（人混みがどうも苦手で）' },

    // why: "cooking turkey" ← turkey is the topic; "a joke at the table" ← Joey's own reading of that day
    { id: 'd2', skill: 'detail', level: 'B2', point: 'poultry', seg: [17.95, 31.8],
      stem: 'What example is given of Rachel’s problem?',
      choices: ['She left the room because of a roast chicken', 'She felt sick while a turkey was being cooked',
                'She got upset at a joke played at the table'], a: 0,
      cue: '「She is?」と聞き返されたあとの答え。',
      line: 'I had to *leave the room* the other day when you had that *roast chicken*',
      said: '「この前ローストチキンが出たとき、部屋を出なきゃいけなかったでしょ」と例を挙げる。',
      mean: '鶏肉を見るのもつらい、という説明。ジョーイは別の理由だと思っていた。',
      trap: '話題がターキーなので「ターキー」を選びやすい。例に出た料理の名前を聞き取る。',
      use: 'I had to leave the room.（部屋を出るしかなかった）' },

    // why: two ← "two pizzas" later in the clip; four ← counting the names Monica lists
    { id: 'n1', skill: 'number', level: 'B1', point: 'three', seg: [31.8, 37], keep: true,
      stem: 'For how many people would Monica be making the turkey?',
      choices: ['Two', 'Three', 'Four'], a: 1,
      cue: '「people」の直前の数字。', line: 'a whole turkey for just *three people*',
      said: '「たった三人のためにターキーを丸ごと作る」と言っている。',
      mean: 'just three ＝「たった三人」。just が少なさを強調している。',
      trap: '名前がいくつも出るので数えたくなるが、数字は本人が言っている。people の前を聞く。',
      use: 'a table for three, please（三人です、お願いします）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'worth', reveals: ['phoebe'], seg: [31.8, 37],
      stem: 'Type what she says: “Anyway, it just ___ to make a whole turkey…” (4 words)',
      answer: "doesn't seem worth it",
      cue: '「Anyway, it just」のすぐあと。', line: 'Anyway, it just *doesn’t seem worth it* to make a whole turkey',
      said: '「とにかく、ターキー丸ごとはやる価値がない気がする」。',
      mean: 'seem で「〜な気がする」と少し和らげている。worth it ＝ その価値がある。',
      trap: 'worth it は「ワーシット」とつながる。th のあとの it を落としやすい。',
      use: 'Was it worth it?（それ、やった価値あった？）' },

    // R fix: blind 75 % — only the key gave Joey a role; all three now turn on what Joey offers (V2/K5)
    // why: "help cook" ← "I will finish that turkey" heard as finishing the cooking; "holds firm, Joey cooks" ← the
    // title, with Joey's push read as a do-it-yourself offer
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['promise', 'fine', 'leftover'], seg: [36.5, 75],
      stem: 'How is the turkey question settled by the end?',
      choices: ['Monica gives in, and Joey vows to eat what is left',
                'Monica gives in once Joey offers to help her cook it',
                'Monica holds firm, so Joey says he’ll cook one himself'], a: 0,
      cue: 'ジョーイの例えのあと、モニカの返事と約束。',
      said: 'ジョーイが感謝祭にはターキーが必要と押し、モニカが折れる。残りはジョーイが食べると約束。',
      mean: '作らない宣言から、ジョーイの説得と約束で作る流れに変わる。',
      trap: 'finish を「料理を仕上げる」と取りやすいが、ここは食べきる意味。',
      use: 'Okay, you talked me into it.（分かった、君に説得されたよ）' },

    // R fix: blind 70 % — the stem quoted the marker under test; it now names the moment. "Not so sure" is now a
    // softening, a coherent reading of a hedge-like marker (S2/V2)
    // why: "corrects himself" ← I mean as a self-repair; "softens" ← I mean read as a hedge (日本語の「まあ」)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', seg: [36.8, 49],
      stem: 'Right after Joey insists on turkey, what does his next sentence do?',
      choices: ['It backs up his demand with a couple of comparisons',
                'It softens his demand into a mere suggestion', 'It corrects a word he got wrong a moment ago'], a: 0,
      cue: '「I mean」のあと、何が続くか。',
      line: '*I mean*, Thanksgiving with no turkey is like… Fourth of July with no apple pie',
      said: '「だって、ターキーのない感謝祭なんて、パイのない独立記念日みたい」と続ける。',
      mean: 'I mean は「つまり・だって」。言ったことを例えで補強する合図。',
      trap: 'I mean は言い直しにも使うが、ここは前の言葉を取り消していない。後ろの中身で判断。',
      use: 'I mean, who doesn’t love pizza?（だって、ピザ嫌いな人いる？）' },

    // R fix: blind 60 % — the key was the one nuanced choice (K6); each distractor now has its own twist (V2)
    // why: "glad" ← "if it means that much to you" read as warmth; "really refusing" ← "fine" read as a sarcastic no,
    // and the "but" heard as the real answer
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'fine', reveals: ['outcome', 'leftover'], seg: [48.8, 55.8],
      stem: 'When Monica answers Joey’s comparisons, how does she feel?',
      choices: ['She gives in, but she is clearly not happy about it',
                'She gives in, glad to see how much it means to him',
                'She sounds as if she gives in, but still refuses'], a: 0,
      cue: '「fine」のあと、「but」で付け足す部分。',
      line: 'All right, *fine*, if it means that much to you, *but*… there’s going to be a ton left over',
      said: '「分かった、いいわよ。そんなに大事なら。でも大量に余るよ」。',
      mean: 'fine と if 以下で、しぶしぶ折れている。but で不満を残す。',
      trap: 'but を断りと取りやすいが、作ること自体は認めている。but のあとは条件や不満。',
      use: 'Fine, if it means that much to you.（そんなに言うなら、いいよ）' },

    // R fix: blind 65 % — "Phoebe upset" was a filler; both distractors now build on "a ton" (V2/K3)
    // why: "more guests" ← "a ton" read as a ton of people; "a ton of time" ← "a lot of work" a moment earlier
    { id: 'i2', skill: 'infer', level: 'B2', point: 'leftover', seg: [48.8, 55.8],
      stem: 'What worry does Monica add after agreeing?',
      choices: ['Much of the turkey would go to waste', 'More guests might turn up than she plans for',
                'Cooking it would take her a ton of time'], a: 0,
      cue: '「but just」のあと、量についての一言。',
      line: 'but just… there’s going to be *a ton left over*',
      said: '「でも、大量に余ることになるわよ」と付け加える。',
      mean: 'a ton ＝ 大量に。三人では食べきれず、無駄になると心配している。',
      trap: 'a ton を人数や手間と取ると別の心配に聞こえる。後ろの left over ＝「余り」まで聞く。',
      use: 'We have a ton of food left over.（料理がめっちゃ余ってる）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'leftover', seg: [48.8, 55.8],
      stem: 'Type what she says: “But there’s going to be ___.” (4 words)', answer: 'a ton left over',
      cue: '「going to be」のあと、つながる四語。', line: 'there’s going to be *a ton left over*',
      said: '「大量に余るわよ」。',
      mean: 'a ton left over がつながって「アタンレフトウヴァ」のように聞こえる。left の t は弱い。',
      trap: 'a は弱く、ton は「トン」ではなく「タン」に近い。left と over もつながって一語に聞こえやすい。',
      use: 'There’s a ton left over.（まだたくさん残ってる）' },

    // R fix: "they want." isn't a real English reply here (§9.5); cut to three choices (K4/K5)
    // why: will ← "I will" comes right after, and won't's n't is weak; don't ← the n't is heard, the vowel isn't
    { id: 's2', skill: 'sound', level: 'B2', point: 'wont', reveals: ['leftover'], seg: [50.8, 55.8],
      stem: 'Fill the gap: “No, no, they ___.”',
      choices: ['will', 'won’t', 'don’t'], a: 1,
      cue: '「No, no」のあと、すぐに打ち消す一語。', line: 'No, no, they *won’t*.',
      said: '「いや、余らないって」と、すぐに打ち消している。',
      mean: 'won’t は「ウォウント」。want（ウォント）と違い、「オウ」と二重母音になる。',
      trap: 'n’t が弱いと will に、母音を逃すと don’t に聞こえる。「余るよ」の打ち消しは won’t。',
      use: 'Don’t worry, it won’t happen again.（大丈夫、もうしないから）' },

    // why: Will ← “I will finish” puts the sound “will” right in the line (and Will is named earlier); Phoebe ← another voice in the scene
    { id: 'w1', skill: 'who', level: 'B1', point: 'promise', reveals: ['outcome'], seg: [52.5, 63.4],
      stem: 'Who promises to finish the turkey?',
      choices: ['Joey', 'Will', 'Phoebe'], a: 0,
      cue: '約束のあと、「I’m a」に続く名字。', line: 'I *promise* I will finish that turkey. … Because I’m a *Tribbiani*.',
      said: '「僕が全部食べるって約束する」「だって僕はトリビアーニだから」。',
      mean: '名字で、約束したのがジョーイだと分かる。自分から食べる役を引き受けている。',
      trap: '文中の I will が名前の Will に聞こえやすい。だれの約束かは、あとの名字で確かめる。',
      use: 'I promise I’ll pay you back.（必ず返すって約束する）' },

    // R fix: blind 60 % — "agrees it is obviously true" read as odd without the idiom; it's now "impressed", the
    // admiring reading of the same idiom (V2/K3)
    // why: "impressed" ← "You're telling me!" (= ほんとそれ) read as admiration; "worried" ← an entire turkey heard,
    // the caring-friend script
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'telling', reveals: ['sitting', 'promise'], seg: [55.6, 60.8],
      stem: 'When Monica responds to Joey’s promise, what is her attitude?',
      choices: ['She doubts that he can really do all that', 'She is impressed that he can eat so much',
                'She is worried he will make himself really sick'], a: 0,
      cue: '文の始まり方と、最後の上がる調子。',
      line: '*You’re telling me* you can eat almost an entire turkey in one sitting?',
      said: '「一回でほぼ丸ごと食べられるって言うの？」と聞き返す。',
      mean: 'You’re telling me ～? は「本気で〜って言ってるの？」という疑い。',
      trap: '単独の You’re telling me! は「ほんとそれ」。後ろに文が続き、上がり調子なら疑い。',
      use: 'You’re telling me it’s free?（それがタダだって言うの？）' },

    // R fix: blind 75 % — the stem quoted the phrase under test; it now names the moment. "While seated" was close to
    // true (K1); it's now a keyword trap on "sitting" (S2/V2)
    // why: "before the rest sit down" ← sitting heard as sitting down to dinner; "by the end of the day" ← a whole
    // turkey sounds like a day's food
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'sitting', reveals: ['promise'], seg: [55.6, 60.8],
      stem: 'What does Monica ask whether Joey can really do?',
      choices: ['Eat almost a whole turkey during a single meal', 'Eat almost a whole turkey by the end of the day',
                'Eat almost a whole turkey before the rest sit down'], a: 0,
      cue: '「turkey」のあと、食べ方を表す三語。', line: 'eat almost an entire turkey *in one sitting*',
      said: '「七面鳥ほぼ丸ごとを一回で食べられるの？」と聞いている。',
      mean: 'in one sitting ＝ 一度に、途中でやめずに。本や映画にも使う。',
      trap: 'sitting を「席に着く」と文字通りに取りやすい。one と組んで「一回の食事」の意味。',
      use: 'I read it in one sitting.（一気に読んじゃった）' },

    // R fix: blind 75 % — "famous name" was a filler; both distractors are now family readings of "this is what we
    // do" (V2/K3)
    // why: "custom" ← "this is what we do" read as a holiday custom; "hurt if he left food" ← the Japanese frame of
    // finishing your plate for the family
    { id: 'i1', skill: 'infer', level: 'B2', point: 'tribbiani', seg: [59.5, 65.8],
      stem: 'What does Joey suggest by naming his family?',
      choices: ['His whole family is known for huge appetites', 'Turkey on Thanksgiving is his family’s custom',
                'His family would be hurt if he left food'], a: 0,
      cue: '名字のあと、「This is」で始まる一文。', line: 'Because I’m a *Tribbiani*. *This is what we do*.',
      said: '「僕はトリビアーニだから。これがうちの家系」と言う。',
      mean: 'This is what we do ＝ うちはこういうもの。大食いは家族の特技だ、ということ。',
      trap: 'what we do を行事の習慣と取りやすい。直前の「全部食べる」につなげて聞く。',
      use: 'We’re Italians. This is what we do.（イタリア人だからね、これが普通）' },

    // R fix: blind 65 % — "Monica's family" was a filler; it's now a keyword trap on "thinkers… leaders" (V2/K3)
    // why: "great thinkers and leaders" ← those words are said, and "may not be" is missed; "admits they can't" ← the
    // flaws heard as a climb-down
    { id: 'h2', skill: 'humor', level: 'C1', point: 'tribbiani', seg: [61, 75],
      stem: 'Why does the audience laugh at Joey’s speech about his family?',
      choices: ['He lists their flaws, then boasts of their eating',
                'He ranks his family with great thinkers and leaders',
                'He admits his family can’t really eat that much'], a: 0,
      cue: '「we may not be」から最後の「but」まで。',
      line: 'we may not be great thinkers… we don’t read a lot… *but damn it, we can eat!*',
      said: '「頭も良くないし本も読まないし足も遅い。でも食べることはできる！」と言う。',
      mean: '欠点を並べて、最後に大食いを誇る。ほめ方の落差が笑いになる。',
      trap: 'thinkers や leaders だけ拾うと自慢に聞こえるが、may not be で否定している。',
      use: 'I can’t cook, but I can bake.（料理はできないけど、お菓子は焼ける）' },
  ]
};
