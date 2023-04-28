function makeForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // プロパティキー「FOLDER_ID」に、カレントフォルダのidを設定
  const ssId = ss.getId();
  const parentFolder = DriveApp.getFileById(ssId).getParents();
  const folderId = parentFolder.next().getId();
  PropertiesService.getScriptProperties().setProperty('FOLDER_ID', folderId);

  // シートの読み取り
  const activeSheet = SpreadsheetApp.getActiveSheet();

  // フォーム名と説明文を取得し、フォームを作成
  const formTitle = activeSheet.getRange(2, 3).getValues();
  const formDescription = activeSheet.getRange(2, 4).getValues();
  const form = FormApp.create(formTitle);

  // フォームをカレントフォルダに移動
  const id = PropertiesService.getScriptProperties().getProperty('FOLDER_ID');
  const formFile = DriveApp.getFileById(form.getId());
  DriveApp.getFolderById(id).addFile(formFile);
  DriveApp.getRootFolder().removeFile(formFile);

  // フォームの説明を追加
  form.setDescription(formDescription);

  //クイズモードに設定
  form.setIsQuiz(true);

  // TODO:学科名が空欄なら入力欄を追加

  // 番号入力欄
  const validationNumber = FormApp.createTextValidation()
    .setHelpText('半角数字で入力して下さい。また1～9番の人は1桁でお願いします。')
    .requireTextMatchesPattern('[1-9]|[1-4][0-9]')
    .build();
  form.addTextItem().setTitle('出席番号（半角数字のみ、1～9番の人は「01」ではなく「1」のように1文字で入力）').setValidation(validationNumber).setRequired(true);

  // 氏名入力欄
  form.addTextItem().setTitle('氏名').setRequired(true);

  // シート読み込み
  const lastRow = activeSheet.getLastRow();
  const lastColumn = activeSheet.getLastColumn();
  const sentenceList = activeSheet.getRange(4, 1, lastRow - 3, lastColumn).getValues();

  // タイトルや設問を追加
  for(let i = 0; i < sentenceList.length; i++) {
    // 出力が「1」でない行はスキップ
    if (sentenceList[i][0] != 1) continue;

    let item, choices = [];

    // 行の種類によってフォームへの追加の仕方を調整
    switch(sentenceList[i][1]) {
      // 「種類：0」タイトル（＋説明）
      case 0:
        item = form.addSectionHeaderItem();
        // タイトルを設定
        item.setTitle(sentenceList[i][2]);
        // 説明を設定
        item.setHelpText(sentenceList[i][3]);
        break;

      // 「種類：1」ラジオボタン形式の設問（答えが1つ）
      case 1:
        item = form.addMultipleChoiceItem();
        // タイトルを設定
        item.setTitle(sentenceList[i][2]);
        // 説明を設定
        item.setHelpText(sentenceList[i][3]);
        // 選択肢を作成
        for(let j = 0; j < 4; j++) {
          if(sentenceList[i][4 + j]) {
            choices.push(item.createChoice(sentenceList[i][4 + j], sentenceList[i][8] == (j + 1)));
          }
        }
        // 選択肢を設定
        item.setChoices(choices);
        // 配点を設定
        if(sentenceList[i][12]) {
          item.setPoints([sentenceList[i][12]]);
        }
        // 送信後表示メッセージを設定（正解・不正解区別なし）
        if(sentenceList[i][13]) {
          item.setFeedbackForCorrect(FormApp.createFeedback().setText(sentenceList[i][13]).build());
          item.setFeedbackForIncorrect(FormApp.createFeedback().setText(sentenceList[i][13]).build());
        }
        break;

      // 「種類：2」チェックボックス形式の設問（答えが複数）
      case 2:
        item = form.addCheckboxItem();
        // タイトルを設定
        item.setTitle(sentenceList[i][2]);
        // 説明を設定
        item.setHelpText(sentenceList[i][3]);
        // 正解リストを作成
        const correctList = sentenceList[i].slice(8, 12);
        // 選択肢を作成
        for(let j = 0; j < 4; j++) {
          if(sentenceList[i][4 + j]) {
            choices.push(item.createChoice(sentenceList[i][4 + j], correctList.includes(j + 1)));
          }
        }
        // 選択肢を設定
        item.setChoices(choices);
        // 配点を設定
        if(sentenceList[i][12]) {
          item.setPoints([sentenceList[i][12]]);
        }
        // 送信後表示メッセージを設定（正解・不正解区別なし）
        if(sentenceList[i][13]) {
          item.setFeedbackForCorrect(FormApp.createFeedback().setText(sentenceList[i][13]).build());
          item.setFeedbackForIncorrect(FormApp.createFeedback().setText(sentenceList[i][13]).build());
        }
        break;

      default:
        break;
    }
  }
}