function kmpSearch(text, pattern) {
    // 创建部分匹配表（也称为失败函数）
    function buildPartialMatchTable(pattern) {
      const table = [0];
      let prefixIndex = 0;
      let suffixIndex = 1;
  
      while (suffixIndex < pattern.length) {
        if (pattern[prefixIndex] === pattern[suffixIndex]) {
          table[suffixIndex] = prefixIndex + 1;
          prefixIndex++;
          suffixIndex++;
        } else if (prefixIndex === 0) {
          table[suffixIndex] = 0;
          suffixIndex++;
        } else {
          prefixIndex = table[prefixIndex - 1];
        }
      }
  
      return table;
    }
  
    const table = buildPartialMatchTable(pattern);
    let textIndex = 0;
    let patternIndex = 0;
  
    while (textIndex < text.length) {
      if (pattern[patternIndex] === text[textIndex]) {
        if (patternIndex === pattern.length - 1) {
          return true; // 找到匹配
        }
        patternIndex++;
        textIndex++;
      } else if (patternIndex > 0) {
        patternIndex = table[patternIndex - 1];
      } else {
        textIndex++;
      }
    }
  
    return false; // 没有找到匹配
  }
  
  function containsBannedWord(text, bannedWords) {
    for (let i = 0; i < bannedWords.length; i++) {
      if (kmpSearch(text, bannedWords[i])) {
        return true; // 找到违禁词
      }
    }
    return false; // 没有找到违禁词
  }
  
  // 使用示例
  const text = "这是一个测试文本，包含违禁词示例。";
  const bannedWords = ["违禁词", "测试", "示例"];
  
  console.log(containsBannedWord(text, bannedWords)); // 应该返回true

  module.exports={
    containsBannedWord
  }
  