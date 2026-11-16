// “Dwight Gives Michael His Urine - The Office US” (the official The Office channel, BEST OF SEASON 2 - The Office US):
// a drug test is announced; Michael, who may have got high by accident at a concert, tries to cancel it, then asks his
// staff and finally Dwight for clean urine; a closing talking head about a father who cheated at games.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–13 s (the “narc” bit: several voices,
// unnamed), 104–111 s (“That goes directly to the tester”: speaker unclear), 165–170 s (whisper “We're forced… Was
// something wrong?”, captions “Were you forced… Is something wrong?”), 200–215 s (the Schrute names: world knowledge),
// 240 s on (whisper loops one line; no talk). Named in the audio: Michael (8.9 s, 180.9 s), Toby (30.0 s), Dwight
// (119.5 s); the drug-test announcer and the worker asked for filing are unnamed and never asked about.
//   open: 57–60 s captions “clove cigarettes”, whisper “closed cigarettes” (t2's line trims the word); 72 s the captions
//   lose Michael's “I can't” before “do that. It is my office.” (t1 keys on “It is my office”, in both); 120 s captions
//   “But with purpose”, whisper “For what purpose?” (not used)
// EAR CHECK: 184 s nt1 — the answer “I want him to have all the urine he needs” is Dwight's (assumed: the question
//   offers him the choice; neither source marks the speaker)
// REVIEW 2026-11-16: pass 6, fix 16, drop 1, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const dwightUrine: Clip = {
  id: 'dwighturine', video: 'EkZrJC4_xHA', title: 'Dwight Gives Michael His Urine', dur: 291, wpm: 168, band: 'mid',
  tags: ['職場', 'お願い・断り'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): only the key was about himself and the concert (and the title points there). All three
    //   are now worries.
    // why: catch staff ← he cancels the test and offers his own check instead, the kind-boss script; look bad ←
    //   “if drugs are found on the premises” heard as a worry about the office's name
    { id: 'g1', skill: 'gist', level: 'B2', point: 'problem', reveals: ['high'], seg: [13.0, 140.5],
      stem: 'What problem drives Michael’s actions in this clip?',
      choices: ['He worries his own test would show drugs', 'He worries the test would catch his staff',
                'He worries the test will make the office look bad'], a: 0,
      cue: 'コンサートの話と、検査を止めようとする動き。',
      said: 'ドラッグ検査が決まり、マイケルは中止しようとする。実はコンサートで吸ってしまったかもしれない。',
      mean: '部下を守るためではなく、自分の結果が心配で動いている。',
      trap: '検査を中止して代わりを申し出るので、部下思いに見える。告白から、理由は自分だと分かる。',
      use: 'I’m worried I won’t pass.（受からない気がして心配）' },

    // R fix: V2 (blind 55 %): “within 24 hours” is the default anyone guesses. Retargeted to when the testers come
    //   (“in a couple of hours”), with the 24 hours said right after as the keyword trap. Seg 21.9–29.3 → 14.7–29.6.
    // why: an hour ← “a couple” heard loosely as “soon”; within a day ← “within 24 hours”, said right after, is the
    //   policy's limit; a couple of days ← “couple” caught, “hours” missed
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', seg: [14.7, 29.6],
      stem: 'How soon are the drug testers coming?',
      choices: ['In about an hour', 'In a couple of hours', 'Within a day', 'In a couple of days'], a: 1, keep: true,
      cue: '「Attention, everyone」のすぐあと。',
      line: 'Drug testers are coming *in a couple of hours*',
      said: '「検査員があと数時間で来る」と告げる。24時間は、会社の規則の期限。',
      mean: 'a couple of ＝ 2つほど。ここでは「2時間ほどで」。急な話。',
      trap: 'あとの within 24 hours が耳に残りやすい。来る時と、規則の期限を分けて聞く。',
      use: 'I’ll be there in a couple of hours.（2時間ほどで着きます）' },

    // why: hired this year ← “job application” heard as new hires only; his choice ← Michael is the boss, and
    //   “random” sounds like it's up to someone
    { id: 'i3', skill: 'infer', level: 'B2', point: 'policy', seg: [29.3, 36.0],
      stem: 'When Michael asks Toby if it’s true, what does the answer mean for him?',
      choices: ['The test is real, and he agreed to it long ago', 'The test is only for workers hired this year',
                'The test is his own choice to make, as the boss'], a: 0,
      cue: '「when you sign」から、誰が何に同意したか。',
      line: 'when you sign your job application, you *agree to comply with random drug testing*.',
      said: '「書類にサインした時点で、抜き打ち検査に従うと同意している」と答える。',
      mean: 'Yes とは言わないが、規則は本当でマイケルも断れない。',
      trap: 'job application から新人だけの話と思いやすい。you は全員のこと。',
      use: 'By signing, you agree to the rules.（署名すると、規則に同意したことになります）' },

    // why: front row ← “great seats” usually means up front; from a friend ← “friends” come up later, and “scored”
    //   can sound like getting something free
    // R fix: S3: the cue quoted “great”, a word only the key has (tested). The cue now points at the place.
    { id: 'd2', skill: 'detail', level: 'B1', point: 'aisle', seg: [37.8, 44.25],
      stem: 'What does Michael say about his seats at the concert?',
      choices: ['He got great aisle seats', 'He got seats in the front row', 'He got free seats from a friend'], a: 0,
      cue: '「Performing Arts Center」のあと、席の話。',
      line: 'I *scored* these *great aisle seats*.',
      said: 'コンサートで、いい通路側の席を取ったと話す。',
      mean: 'score ＝ うまく手に入れる。aisle（アイル）は通路で、s は発音しない。',
      trap: 'great seats で最前列を思い浮かべやすい。aisle は「アイル」と短く、I’ll に似ている。',
      use: 'Could I have an aisle seat, please?（通路側の席をお願いできますか）' },

    // R fix: V2 (blind 50 %) + N7: “which he rarely sees” made the key the only specific one, and “the aisle seat”
    //   gave d2's key. Now three short, parallel reasons.
    // why: knew him ← “I don't know exactly how this happened” heard as meeting someone he knows; same singer ← they
    //   are at the same concert, the usual meet-cute script
    { id: 'd3', skill: 'detail', level: 'B1', point: 'lipring', seg: [44.25, 51.3],
      stem: 'What made the girl who sat next to Michael special to him?',
      choices: ['She had a lip ring', 'She knew him from work', 'She loved the same singer'], a: 0,
      cue: '「I never get to meet」のあと。',
      line: 'I *never get to meet girls with lip rings*, and she had one.',
      said: '「リップリングの子に会う機会なんてないのに、その子はしてた」と話す。',
      mean: 'never get to ～ ＝ ～する機会がない。珍しい出会いに浮かれている。',
      trap: '同じコンサートなので、好きな歌手の話と思いやすい。one は lip ring のこと。',
      use: 'I never get to sleep in.（朝寝坊できることなんてない）' },

    // R fix: V2 + K6 (blind 65 %): the key was the only nuanced choice. All three now start “Sure in words”.
    // why: saw them ← the literal “I'm sure”, as if he checked; calm ← “I'm sure” heard as settled, missing “I don't
    //   know exactly how this happened” just before
    { id: 't2', skill: 'attitude', level: 'C1', point: 'clove', seg: [51.3, 60.5],
      stem: 'When Michael repeats what her friends said, how sure does he sound?',
      choices: ['Sure in words, but talking himself into it', 'Sure in words, since he saw them himself',
                'Sure in words, and calm about the whole night'], a: 0,
      cue: '「they said」と「I’m sure」の、同じ言葉のくり返し。',
      line: 'they *said* that it was … cigarettes, and *I’m sure* that it was … cigarettes.',
      said: '友だちは「ただのタバコ」と言ったし、自分もそう確信している、と言う。',
      mean: '聞いた話を「確信」でくり返すのは、自分に言い聞かせる言い方。',
      trap: 'I’m sure をそのまま取りやすい。直前の I don’t know exactly how に迷いが出る。',
      use: 'I’m sure it’ll be fine. Probably.（きっと大丈夫。たぶん）' },

    // R fix: V2 (blind 55 %): “the aisle was crowded” was weak. Now the “everybody (but me)” reading.
    // why: reporting ← the “narc” bit at the start, and he tells what others did; stayed out ← the Japanese frame
    //   「みんなは…（でも僕は）」, the excuse heard as setting himself apart
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'everybody', reveals: ['aisle'], seg: [58.5, 62.9],
      stem: 'With his last sentence about that night, what is Michael doing?',
      choices: ['Making his own part sound normal', 'Reporting the others to the camera',
                'Showing he alone stayed out of it'], a: 0,
      cue: '最後の文の主語「Everybody」の役目。',
      line: '*Everybody* in the aisle *was doing it*.',
      said: '「通路の全員がやってた」と付け足す。',
      mean: 'みんなやっていた＝自分だけ悪くない、という言い訳。自分もやったと認めたのと同じ。',
      trap: '他人のことを話しているので告げ口に聞こえやすい。言い訳の「みんなやってた」は世界共通の型。',
      use: 'Everybody was doing it!（みんなやってたんだよ）' },

    // R drop: i2 (V2, blind 85 %; same fact as g1): “Right after the concert story, why does he cancel?” answers
    //   itself, and g1 already keys on his fear of his own test. Deleted (never shipped).

    // why: test themselves ← “each of you” heard as each person doing it; testers back ← “canceled” heard as
    //   “put off”
    { id: 'd5', skill: 'detail', level: 'B1', point: 'visual', seg: [63.0, 71.95],
      stem: 'What does Michael say he will do instead of the test?',
      choices: ['Go to each person and check them by eye', 'Have each person test themselves at home',
                'Bring the testers back in a few days'], a: 0,
      cue: '「Instead,」のあと。',
      line: 'I will be going around to each of you and doing a *visual inspection*.',
      said: '代わりに、一人ずつ回って目で見て調べる、と言う。',
      mean: 'visual inspection ＝ 目で見る検査。尿検査の代わりにはならない。',
      trap: 'each of you を聞くと、各自がやるように思える。主語は I で、回るのはマイケル。',
      use: 'I’ll go around and check each table.（各テーブルを回って確認します）' },

    // R fix: V2 + GUIDE §9.4 (blind 90 %): the title (“Dwight Gives Michael His Urine”) gave “borrowing urine”. Now
    //   asks why the plan turns, with the title's reading (Dwight offers) as the trap.
    // why: testers ask ← “That goes directly to the tester” and the official-test rule heard as an order to collect;
    //   Dwight offers ← the title, though Dwight first says “Then I refuse” and is asked, not offering
    { id: 'g2', skill: 'gist', level: 'B2', point: 'plans', reveals: ['visual'], seg: [63.0, 191.9],
      stem: 'Why does Michael end up going around asking for urine?',
      choices: ['His own check is ruled out; it must be a urine test', 'The testers ask him to collect urine from the staff',
                'Dwight offers his urine, and Michael accepts it'], a: 0,
      cue: '目で見る検査を止められた理由と、そのあと。',
      said: '目で見る検査を提案するが、正式な尿検査でないとだめと言われ、部下に尿を頼んで回る。',
      mean: '検査は避けられないと分かり、他人の尿でごまかす方向に変わる。',
      trap: 'タイトルから Dwight の申し出と思いやすいが、頼むのはマイケルで、Dwight は一度断る。',
      use: 'Plan B: we borrow one.（プランB：借りよう）' },

    // R fix: V2 + N7 (blind 80 %): the stem said “the inspection”, d5's key; “Amused… a joke” was weak. Now
    //   “embarrassed”, and the stem names no plan or speaker.
    // why: unsure ← the echo “I can't do that?” has a question's form (literal reading); embarrassed ← a boss told
    //   off in front of staff usually backs down (the Japanese frame of losing face)
    { id: 't1', skill: 'attitude', level: 'B2', point: 'myoffice', seg: [71.2, 79.8],
      stem: 'When told he can’t do that, how does Michael react?',
      choices: ['Defiant: it’s his office, so his rules', 'Unsure: he really asks if it’s allowed',
                'Embarrassed: he sees the plan won’t work'], a: 0,
      cue: '聞き返しのあとの、もう一文。',
      line: 'No, you can’t do that. — I can’t do that? *It is my office.*',
      said: '「できない」と言われ、「できない？ここは僕のオフィスだ」と言い返す。',
      mean: '聞き返しは質問ではなく反発。my office で、上司の自分が決めると主張している。',
      trap: '疑問の形なので、本当に確認しているように聞こえる。すぐ続く理由の文で、反論だと分かる。',
      use: 'My house, my rules.（うちではうちのルール）' },

    // R fix: GUIDE §9.5 (blind 70 %): “had to” clashed with “you cannot” (present), so tense picked the key. Now three
    //   present forms.
    // why: has got to ← “has” heard and the weak “got” assumed; ought to ← “oughta” and “hasta” share one rhythm
    { id: 's1', skill: 'sound', level: 'B1', point: 'official', seg: [73.35, 79.8],
      stem: 'Fill the gap: “No, you cannot. It ___ be official.”',
      choices: ['has to', 'has got to', 'ought to'], a: 0,
      cue: '「you cannot」のすぐあと。',
      line: 'No, you cannot. It *has to* be official, and it has to be urine.',
      said: '「いいえ。正式な検査で、尿でなければならない」と言う。',
      mean: 'has to は「ハストゥ」「ハスタ」と縮む。規則として「〜でなければならない」。',
      trap: '弱い got を補いやすいが、ここにはない。and のあとの2回目の has to で確かめる。',
      use: 'It has to be in writing.（書面でなければいけません）' },

    // R fix: V2 (blind 75 %): only the key held the odd request. A second urine reading (it's for the account) joins.
    // why: for the account ← “work on the St. Andrews account. I need your urine” run together; forgets ← “That —
    //   just forget it” heard as Michael losing track
    { id: 'h1', skill: 'humor', level: 'C1', point: 'filing', seg: [92.3, 101.7],
      stem: 'Why does the audience laugh at Michael’s request about the St. Andrews account?',
      choices: ['He treats urine like a normal work task', 'He tells the worker the urine is for the account',
                'He forgets which work task he came to ask for'], a: 0,
      cue: '仕事の頼みのあいだに、一つだけ違う物。',
      line: 'work on the St. Andrews account. *I need your urine.* I need some filing done.',
      said: '仕事の頼みに「尿が要る」を混ぜ、聞き返されると「尿だけでいい」。',
      mean: 'ふつうの仕事にまぎれさせて、とんでもない頼みをする。仕事は口実だった。',
      trap: 'forget it を「忘れた」と取りやすい。ここは整理の話を捨てている。',
      use: 'Never mind that. Just the coffee.（それはいいや。コーヒーだけで）' },

    // why: after that ← then = 次に, the first meaning learners know; even so ← a refusal of a boss sounds like
    //   defiance (それでも)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'refuse', seg: [111.4, 123.5],
      stem: 'When Dwight answers Michael’s “none of your business”, what does his first word mean?',
      choices: ['In that case', 'After that', 'Even so'], a: 0,
      cue: '「none of your business」への返事、最初の一語。',
      line: 'It’s none of your business. — *Then* I refuse.',
      said: '何のためか聞いて「関係ない」と言われ、「それなら断る」と返す。',
      mean: 'この Then は「それなら」。相手の答えを条件にして、自分の決定を言う。',
      trap: 'then を「次に」と覚えていると、順番の話に聞こえる。返事の頭の then は、たいてい「それなら」。',
      use: 'Then I’ll take the next train.（それなら次の電車にします）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'high', seg: [131.2, 135.2],
      stem: 'Type what Michael says: “I think I ___ high accidentally.” (3 words)', answer: 'may have gotten',
      cue: '「I think I」のあと、high の前の3語。',
      line: 'I think I *may have gotten* high accidentally',
      said: '「うっかりハイになったかもしれない」と打ち明ける。',
      mean: 'may have は「メイヴ」と縮む。may have ＋過去分詞で「〜したかもしれない」。',
      trap: 'have が「ヴ」だけになり、may gotten と書きやすい。過去の推量は may have。',
      use: 'I may have lost my passport.（パスポートをなくしたかも）' },

    // R fix: V2 (blind 75 %): “a cup washed clean” was weak. Now the keyword trap on “for the lady”.
    // why: fresh ← clean = 新しい, as in clean sheets; from a woman ← “for the lady” heard as what kind of urine
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'clean', seg: [143.2, 147.4],
      stem: 'What kind of urine does Michael say he needs?',
      choices: ['Urine with no drugs in it', 'Urine taken fresh that day', 'Urine from a woman, for her'], a: 0,
      cue: '「I need」のあと、urine の前の一語。',
      line: 'I need *clean* urine for the lady.',
      said: '「検査の女性に出す、きれいな尿が要る」と言う。',
      mean: 'clean ＝ ここでは「薬物が出ない」。検査で clean なら陰性。',
      trap: 'clean を「新しい」、for the lady を尿の種類と取りやすい。検査の clean は何も出ないこと。',
      use: 'The test came back clean.（検査は異常なしだった）' },

    // R fix: V2 (blind 60 %): “admit… beg” was the odd one out. Now a second recasting (a favor), so “just happens”
    //   has to be heard.
    // why: favor ← “Don't think of it that way” heard as “think of it as helping me”; no law ← “there's no controlling it” heard as
    //   “there are no rules”
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'accident', seg: [151.5, 165.3],
      stem: 'When Dwight says it’s illegal, what does Michael try to do?',
      choices: ['Recast it as something that just happens', 'Recast it as a favor between friends',
                'Argue that no law covers a urine test'], a: 0,
      cue: '「that way」のあと、尿についての説明。',
      line: '*Don’t think of it that way.* … urine goes all over the place… *It might be an accident.*',
      said: '違法だと言われ「そう考えるな。カップがたまたま下にあるかも」と言う。',
      mean: 'わざと渡すことを偶然の出来事に言いかえ、責任をぼかしている。',
      trap: '友だちへの頼みと言いかえたと取りやすい。続くのは「尿は飛び散る」「事故かも」で、偶然の話。',
      use: 'Don’t think of it as a loss.（損だと思わないで）' },

    // why: not your fault ← the literal reading of “urine goes all over the place… no controlling it”; got high by
    //   accident ← the last-heard keyword: “gotten high accidentally” from his confession (131 s)
    // anchor: 152.0–164.9 s “But that's illegal.” → “Don't think of it that way”, then “A cup could find its way under
    //   the urine. It might be an accident.”: a cup has to be placed, so the “accident” is a story told over a
    //   deliberate act, and “It” is the cup filling, not the concert
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'accident', seg: [151.5, 165.3],
      stem: 'Which plain-English version keeps what Michael means by “It might be an accident”?',
      choices: ['“Do it on purpose, and we’ll call it luck.”', '“If some spills, that’s not your fault.”',
                '“I got high by accident, so help me out.”'], a: 0,
      cue: '「illegal」への返事として、何を偶然と呼んでいるか。',
      line: 'A cup could *find its way under* the urine. It *might be an accident*.',
      said: '違法だと言われ、「カップがたまたま尿の下にあるかも。事故かもね」と言う。',
      mean: 'カップは自分で置くもの。わざとを「偶然」と呼べば違法でない、という言い逃れ。',
      trap: 'accident で、先の accidentally（コンサート）を思い出しやすい。ここの It は、カップに尿が入ること。',
      use: 'Oops, the cake fell on my plate.（あら、ケーキが私のお皿に落ちちゃった）' },

    // R fix: V2 (blind 55 %, C2 one rewrite): “cares about Michael at all” was too far off. Now the near miss that
    //   misses give/have: “happy for Michael to have it”, which he does say.
    // why: happy for him ← the answer's “I want him to have” heard as the thing avoided, missing the verb change; keep refusing ←
    //   “Then I refuse” earlier is his last stated answer
    // anchor: 180.0–186.2 s the question's verb is “give” (“Do you want to give Michael your urine?”), the answer's is
    //   “have” (“I want him to have all the urine he needs”): he backs the result openly and leaves out the act, after
    //   “But that's illegal” (152 s)
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'wanthave', seg: [179.5, 187.0],
      stem: 'When asked if he wants to give Michael his urine, what does Dwight avoid saying?',
      choices: ['That he’d be the one handing it over', 'That he’s happy for Michael to have it',
                'That he would rather keep refusing'], a: 0,
      cue: '質問の動詞と、答えの動詞の違い。',
      line: 'Do you want to *give* Michael your urine? — I want him to *have* all the urine he needs.',
      said: '「マイケルに尿をあげたい？」に「必要なだけ持っていてほしい」と答える。',
      mean: '動詞が give から have に変わる。結果は望むが、渡すのが自分とは言わない。違法な行為から一歩引いている。',
      trap: '「持っていてほしい」は言っているので、避けたのはそこではない。質問の語をどこで変えたかを聞く。',
      use: 'Let’s just say the door will be unlocked.（ドアは開いてる、とだけ言っておく）' },

    // R fix: V2 (blind 60 %): “Don't you think” was the only natural fit. “You don't” (statement-question order) is
    //   now the strong near sound.
    // why: Do you ← the n't of don't fades before “you”; You don't ← the same two words, “you” and “don't” swap
    { id: 's2', skill: 'sound', level: 'B2', point: 'iknow', seg: [187.5, 191.9],
      stem: 'Fill the gap: “I know that. ___ think I know that?”',
      choices: ['Don’t you', 'Do you', 'You don’t'], a: 0,
      cue: '「I know that.」のすぐあと、2語のかたまり。',
      line: 'I know that. *Don’t you* think I know that?',
      said: '「分かってる。分かってるに決まってるだろ？」と言う。',
      mean: 'Don’t you は t と y がつながり「ドンチュ」。当然分かっている、という反語。',
      trap: 'n’t の t が you と溶け、Do you に聞こえやすい。you が後ろなら「ドンチュ」。',
      use: 'Don’t you think it’s too late?（遅すぎると思わない？）' },

    // R fix: V2 (blind 75 %): “broke his things” was absurd. Now the keyword trap on “cheated”.
    // why: beat ← they “played a lot of games”, so bust heard as winning; cheated as well ← “cheated” just before,
    //   bust read as joining in
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'busted', seg: [230.9, 234.3],
      stem: 'In the story about the dad’s games, what does “busted him” mean?',
      choices: ['Caught him and called him out', 'Beat him at his own games', 'Copied him and cheated as well'], a: 0,
      cue: '「cheated a lot, but」のあと。',
      line: 'My dad *cheated* a lot, but I never *busted him* on it.',
      said: '「父はよくずるをしたけど、一度も指摘しなかった」と言う。',
      mean: 'bust someone on it ＝ 悪事を押さえて、とがめる。ここでは「ずるを見破る」。',
      trap: '直前の cheated につられ、一緒にずるをしたと取りやすい。it は父のずる。',
      use: 'My kid busted me eating his candy.（子どもにお菓子を食べてるのを見つかった）' },

    // R fix: V2 (blind 75 %): “too clumsy to cheat well” was weak, leaving the key the only twist. Now a second
    //   “His loyalty turns out to be…” (fear).
    // why: cheated too ← “I would have” heard as “I would have cheated too”; fear ← “I would have” heard as “I
    //   wanted to but didn't dare”
    { id: 'h3', skill: 'humor', level: 'C1', point: 'except', reveals: ['busted'], seg: [230.9, 240.3],
      stem: 'Why does the audience laugh at what follows “I never busted him on it”?',
      choices: ['His loyalty turns out to be just not knowing', 'He admits that he cheated at the games too',
                'His loyalty turns out to be fear of his dad'], a: 0,
      cue: '「I would have」のあとの、except の文。',
      line: 'I *would have*, *except I didn’t know* about it.',
      said: '「指摘したさ、知ってさえいれば」と続け、あとで知って驚いたと言う。',
      mean: '父をかばう美談が、ただ気づかなかっただけと分かる。前の文が逆転する笑い。',
      trap: 'would have のあとを「自分もずるをした」と補いやすい。省かれたのは busted him。',
      use: 'I would’ve helped, except no one asked.（手伝ったのに、誰も頼まなかった）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'except', seg: [234.25, 237.05],
      stem: 'Type what is said: “I ___, except I didn’t know about it.” (2 words)', answer: 'would have',
      cue: '「busted him on it」のあと、短い2語。',
      line: 'I *would have*, except I didn’t know about it.',
      said: '「指摘していたよ、知っていれば」と言う。',
      mean: 'would have は「ウダヴ」とつながり、have は「ヴ」程度に弱まる。',
      trap: 'have が弱く、would だけ書きやすい。あとに何もない would have は、前の動詞の省略。',
      use: 'I would have called, but my phone died.（電話したかったけど、充電が切れて）' },
  ]
};
