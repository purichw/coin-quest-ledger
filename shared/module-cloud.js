(function () {
  // Browser module data remains locally recoverable. Only an authenticated owner
  // can connect it to their existing playerModules document.
  const testMode = new URLSearchParams(location.search).get('test') === '1';
  let config = null, account = null, baseline = '', connected = false, applying = false, epoch = 0;
  let queue = Promise.resolve(); let panel;
  const contentKey = value => PointyLogic.tripContentKey({ value: value ?? null });
  const blocked = value => ['archived', 'deactivated', 'delete_requested', 'deleted'].includes(String(value || '').toLowerCase());
  const currentUid = () => window.PointyFirebase?.auth()?.currentUser?.uid || '';
  const metaKey = 'pointy_module_sync_v1';
  function remember(value = PointyScope.getJSON(config.key, null, { account })) {
    const meta = PointyScope.getJSON(metaKey, {}, { account });
    PointyScope.setJSON(metaKey, { ...meta, [config.field]: { cloud: baseline, local: contentKey(value) } }, { account });
  }
  function clearNotice() { panel?.remove(); panel = null; }
  function problem(message, choices = false) { return Object.assign(new Error(message), { playerMessage: message, choices }); }
  function showError(error, choices = false) {
    console.warn('Player module save/load failed', error);
    const fallback = error?.name === 'QuotaExceededError'
      ? 'พื้นที่เก็บข้อมูลในเครื่องเต็ม ยังไม่ได้แทนที่ข้อมูล กรุณาเพิ่มพื้นที่ว่างแล้วลองอีกครั้ง'
      : 'เชื่อมต่อไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง ข้อมูลในเครื่องยังอยู่';
    show(error?.playerMessage || fallback, error?.choices ?? choices);
  }
  function show(message, choices = false) {
    if (!panel) {
      panel = document.createElement('aside'); panel.className = 'module-sync-banner'; panel.setAttribute('aria-label', 'ข้อมูลที่ต้องตรวจสอบ');
      const header = document.querySelector('header'); if (header) header.insertAdjacentElement('afterend', panel); else document.body.prepend(panel);
    }
    panel.replaceChildren(); const status = document.createElement('span'); status.setAttribute('role', 'status'); status.textContent = message; panel.append(status);
    const button = (title, action) => { const element = document.createElement('button'); element.type = 'button'; element.textContent = title; element.onclick = () => { element.disabled = true; Promise.resolve().then(action).catch(error => showError(error, choices)).finally(() => { element.disabled = false; }); }; panel.append(element); };
    if (choices) { button('ใช้ข้อมูลบัญชี', () => choose('cloud')); button('ใช้ข้อมูลเครื่องนี้', () => choose('local')); }
    else button('ลองอีกครั้ง', connect);
    if (account && PointyScope.getJSON(`pointy_module_backup_latest_${config.field}`, null, { account })) button('ดาวน์โหลดสำเนาข้อมูลเดิม', downloadBackup);
  }
  function backup(local, cloud) {
    // Write before replacement; quota failures abort the choice rather than lose a copy.
    const key = PointyScope.key(`pointy_module_backup_${config.field}_${Date.now()}`, account);
    localStorage.setItem(key, JSON.stringify({ local, cloud, savedAt: Date.now() }));
    PointyScope.setJSON(`pointy_module_backup_latest_${config.field}`, key, { account });
  }
  function downloadBackup() {
    const key = PointyScope.getJSON(`pointy_module_backup_latest_${config.field}`, null, { account });
    const value = key && localStorage.getItem(key); if (!value) throw problem('ไม่พบสำเนาในเครื่องนี้');
    const url = URL.createObjectURL(new Blob([value], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `coin-quest-${config.field}-before-sync.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function apply(value) {
    applying = true;
    try { PointyScope.setJSON(config.key, value, { account }); config.apply(value); }
    finally { applying = false; }
  }
  async function remote() {
    const uid = account?.uid;
    if (!uid || uid !== currentUid()) throw problem('กรุณาเข้าสู่ระบบบัญชีเดิมก่อน');
    const ref = PointyFirebase.firestore().collection('playerModules').doc(uid);
    const snap = await PointyFirebase.freshGet(ref);
    return { ref, value: snap.data()?.[config.field] };
  }
  async function choose(source) {
    await queue;
    connected = false;
    const version = ++epoch; const result = await remote(); if (version !== epoch || account?.uid !== currentUid()) return;
    const local = PointyScope.getJSON(config.key, null, { account });
    if (!confirm(source === 'cloud' ? 'แทนที่ข้อมูลในเครื่องด้วยข้อมูลบัญชี? จะเก็บสำเนาข้อมูลเดิมไว้ก่อน' : 'แทนที่ข้อมูลบัญชีด้วยข้อมูลเครื่องนี้? การเปลี่ยนแปลงจะมีผลกับอุปกรณ์อื่นด้วย โดยเก็บสำเนาทั้งสองชุดไว้ก่อน')) { show('เลือกข้อมูลที่ต้องการใช้ ข้อมูลเดิมยังอยู่', true); return; }
    backup(local, result.value); baseline = contentKey(result.value); connected = true;
    if (source === 'cloud') { apply(result.value ?? config.empty()); remember(); clearNotice(); }
    else await enqueue(local ?? config.empty());
  }
  function enqueue(value) {
    const uid = account?.uid, version = epoch, selected = config;
    const copy = PointyLogic.cleanFirestoreData(JSON.parse(JSON.stringify(value)));
    const save = async () => {
      if (!connected || version !== epoch || currentUid() !== uid) return;
      try {
        await PointyFirebase.firestore().runTransaction(async tx => {
          if (currentUid() !== uid || version !== epoch) throw problem('บัญชีเปลี่ยน กรุณาเปิดหน้าใหม่');
          const user = await tx.get(PointyFirebase.firestore().collection('users').doc(uid));
          if (!user.exists || blocked(user.data().status) || blocked(user.data().lifecycleStatus)) throw problem('บัญชีไม่พร้อมใช้งาน กรุณาเข้าสู่ระบบอีกครั้ง');
          const ref = PointyFirebase.firestore().collection('playerModules').doc(uid); const snap = await tx.get(ref);
          if (currentUid() !== uid || version !== epoch) throw problem('บัญชีเปลี่ยน กรุณาเปิดหน้าใหม่');
          if (contentKey(snap.data()?.[selected.field]) !== baseline) throw problem('มีการแก้ไขจากอีกเครื่อง เลือกข้อมูลที่ต้องการใช้ก่อนบันทึกต่อ', true);
          tx.set(ref, { uid, characterId: account.character?.id || account.characterId || '', schemaVersion: 2, [selected.field]: copy, updatedAt: PointyFirebase.serverTimestamp() }, { mergeFields: ['uid', 'characterId', 'schemaVersion', selected.field, 'updatedAt'] });
        });
        if (version !== epoch) return;
        baseline = contentKey(copy); remember(copy); clearNotice();
        window.dispatchEvent(new CustomEvent('pointy-module-synced', { detail: { uid, field: selected.field, value: copy } }));
      } catch (error) { if (version === epoch) { connected = false; showError(error); } throw error; }
    };
    const result = queue.then(save); queue = result.catch(() => {}); return result;
  }
  async function connect() {
    if (testMode || !config) return;
    await queue;
    const next = PointyScope.readAuth();
    if (!next?.uid || next.uid !== currentUid() || next.signedOut) { connected = false; return; }
    connected = false;
    account = next; const version = ++epoch;
    const beforeRead = contentKey(PointyScope.getJSON(config.key, null, { account }));
    try {
      const result = await remote(); if (version !== epoch || account?.uid !== currentUid()) return;
      const local = PointyScope.getJSON(config.key, null, { account });
      if (contentKey(local) !== beforeRead) {
        show('มีรายการใหม่ระหว่างโหลดข้อมูล เลือกข้อมูลที่ต้องการใช้ ข้อมูลเดิมยังอยู่', true); return;
      }
      const meta = PointyScope.getJSON(metaKey, {}, { account })[config.field];
      const remembered = typeof meta === 'string' ? meta : meta?.local;
      const cloudKey = contentKey(result.value); const localKey = contentKey(local);
      baseline = cloudKey;
      if (local !== null && localKey !== cloudKey && remembered !== localKey) {
        connected = false; show('ข้อมูลเครื่องนี้กับบัญชีไม่ตรงกัน เลือกข้อมูลที่ต้องการใช้', true); return;
      }
      if (local !== null && result.value === undefined && !remembered) {
        connected = false; show('มีข้อมูลเดิมในเครื่องนี้ เลือกข้อมูลที่ต้องการเก็บไว้ในบัญชี', true); return;
      }
      connected = true;
      if (result.value !== undefined) { if (local !== null && localKey !== cloudKey) backup(local, result.value); apply(result.value); }
      else apply(config.empty());
      remember(); clearNotice();
    } catch (error) { if (version === epoch) { connected = false; showError(error); } }
  }
  window.addEventListener('pointy-auth-changed', event => {
    if (!event.detail?.signedIn) { epoch++; connected = false; account = null; clearNotice(); return; }
    if (account?.uid !== event.detail.uid) void connect();
    else account = PointyScope.readAuth();
  });
  window.addEventListener('pointy-scoped-data-changed', event => {
    if (applying || testMode || !config || event.detail?.base !== config.key || !account || event.detail.accountKey !== PointyScope.accountKey(account)) return;
    if (connected) void enqueue(event.detail.value).catch(() => {});
    else show('รายการใหม่ยังอยู่ในเครื่องนี้ เลือกข้อมูลที่ต้องการเก็บไว้ในบัญชี', true);
  });
  window.PointyModuleCloud = { register(next) { config = next; void connect(); } };
})();
