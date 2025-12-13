/**
 * 安全なハッシュ化のためのランダムなソルト（文字列）を生成する。
 * @param {number} length - 生成するソルトの長さ (例: 16)
 * @returns {string} - Base64エンコードされたランダムなソルト
 */
function generateSalt(length = 16) {
  // 必要なバイト数の配列を作成
  const bytes = new Array(length);

  // Crypto.getRandomValues() の代替として、ランダムなバイトを生成
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }

  // バイト配列をBlob化し、Base64エンコードしてソルトとして返す
  return Utilities.base64Encode(bytes);
}

/**
 * セキュリティの重要パラメータ：繰り返しの回数を計算する。
 * @param {number} exponent - log2(Iterations)。例えば 12 ==> 2^12 = 4,096回繰り返す
 */
function calculateIterations(exponent = 10) {
  const BASE = 2;
  const iterations = BASE ** exponent;

  return iterations;
}

/**
 * SHA-256を使用して、指定された回数パスワードをハッシュ化する（ストレッチング）。
 * @param {string} password - ハッシュ化する生のパスワード
 * @param {string} salt - ハッシュ化に使用するソルト
 * @param {number} iterations - ハッシュ化を繰り返す回数（ストレッチング）
 * @returns {string} - Base64エンコードされた最終ハッシュ
 */
function hashWithStretching(password, salt, iterations = calculateIterations(10)) {
  // パスワードとソルトを結合し、初期バイト配列を生成
  let currentBytes = Utilities.newBlob(password + salt, "UTF-8").getBytes();

  // 指定された回数（イテレーション）ハッシュ化を繰り返す（ストレッチング）
  for (let i = 0; i < iterations; i++) {
    // 前回のハッシュ結果を次の入力として、SHA-256でハッシュ化
    currentBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, currentBytes);
  }

  // 最終結果をBase64エンコードして文字列として返す
  return Utilities.base64Encode(currentBytes);
}

/**
 * パスワードをハッシュ化し、ソルトとハッシュをオブジェクトとして返す。
 * @param {string} rawPassword - ユーザーが入力した生のパスワード
 * @returns {{salt: string, hash: string, iterations: number}} - 保存すべきデータ
 */
function storePassword(rawPassword) {
  const hashIterations = calculateIterations(10);
  // ユニークなソルトを生成
  const salt = generateSalt(16);
  // ストレッチング付きでハッシュ化を実行
  const hashedPassword = hashWithStretching(rawPassword, salt, hashIterations);

  return {
    salt: salt,
    hash: hashedPassword,
    iterations: hashIterations
  };
}

/**
 * 入力されたパスワードが保存されているハッシュと一致するかを検証する。
 * @param {string} rawPasswordInput - ユーザーが入力した生のパスワード
 * @param {string} storedSalt - 保存されているソルト
 * @param {string} storedHash - 保存されているハッシュ値
 * @param {number} storedIterations - 保存されているイテレーション数
 * @returns {boolean} - パスワードが一致すれば true
 */
function verifyPassword(rawPasswordInput, storedSalt, storedHash, storedIterations) {
  // ユーザーの入力と保存されているソルト/イテレーションを使って再ハッシュ化
  const reHashedPassword = hashWithStretching(rawPasswordInput, storedSalt, storedIterations);
  // 再ハッシュ化の結果が保存されているハッシュと完全に一致するか比較
  const isMatch = reHashedPassword === storedHash;

  return isMatch;
}