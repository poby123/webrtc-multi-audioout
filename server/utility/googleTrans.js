const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate({
  projectId: process.env.GOOGLE_PROJECT_ID,
  key: process.env.GOOGLE_TRANS_KEY,
});

exports.translateText = async function translateText(text, target) {
  try {
    let [translations] = await translate.translate(text, target);
    translations = Array.isArray(translations) ? translations : [translations];
    const result = translations.join(' ');
    console.log('Translations: ', result);
    return result;
  } catch (error) {
    console.log(`Translation error: ${error} message: ${text} target: ${target}`);
  }

  return '';
};
