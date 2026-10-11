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
  function show(message, choices = false) {
    if (!panel) {
      panel = document.createElement('aside'); panel.className = 'module-sync-banner'; panel.setAttribute('aria-label', 'การซิงก์ข้อมูลบัญชี');
      const header = document.querySelector('header'); if (header) header.insertAdjacentElement('afterend', panel); else document.body.prepend(panel);
    }
    panel.replaceChildren(); const status = document.createElement('span'); status.setAttribute('role', 'status'); status.textContent = message; panel.append(status);
    const button = (title, action) => { const element = document.createElement('button'); element.type = 'button'; element.textContent = title; element.onclick = () => { element.disabled = true; Promise.resolve().then(action).catch(error => show(error.message || 'เชื่อมต่อไม่สำเร็จ ข้อมูลในเครื่องยังอยู่', true)); }; panel.append(element); };
    if (choices) { button('ใช้ข้อมูลบัญชี', () => choose('cloud')); button('ใช้ข้อมูลเครื่องนี้', () => choose('local')); }
    else if (connected) button('ตรวจข้อมูลล่าสุด', connect);
    if (account && PointyScope.getJSON(`pointy_module_backup_latest_${config.field}`, null, { account })) button('ดาวน์โหลดสำเนาก่อนซิงก์', downloadBackup);
  }
  function backup(local, cloud) {
    // Write before replacement; quota failures abort the choice rather than lose a copy.
    const key = PointyScope.key(`pointy_module_backup_${config.field}_${Date.now()}`, account);
    localStorage.setItem(key, JSON.stringify({ local, cloud, savedAt: Date.now() }));
    PointyScope.setJSON(`pointy_module_backup_latest_${config.field}`, key, { account });
  }
  function downloadBackup() {
    const key = PointyScope.getJSON(`pointy_module_backup_latest_${config.field}`, null, { account });
    const value = key && localStorage.getItem(key); if (!value) throw new Error('ไม่พบสำเนาในเครื่องนี้');
    const url = URL.createObjectURL(new Blob([value], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `coin-quest-${config.field}-before-sync.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); show('ดาวน์โหลดสำเนาข้อมูลแล้ว', !connected);
  }
  function apply(value) {
    applying = true;
    try { PointyScope.setJSON(config.key, value, { account }); config.apply(value); }
    finally { applying = false; }
  }
  async function remote() {
    const uid = account?.uid;
    if (!uid || uid !== currentUid()) throw new Error('กรุณาเข้าสู่ระบบบัญชีเดิมก่อน');
    const ref = PointyFirebase.firestore().collection('playerModules').doc(uid);
    const snap = await PointyFirebase.freshGet(ref);
    return { ref, value: snap.data()?.[config.field] };
  }
  async function choose(source) {
    await queue;
    connected = false;
    const version = ++epoch; const result = await remote(); if (version !== epoch || account?.uid !== currentUid()) return;
    const local = PointyScope.getJSON(config.key, null, { account });
    if (!confirm(source === 'cloud' ? 'ใช้ข้อมูลล่าสุดของบัญชีบนเครื่องนี้? จะเก็บสำเนาข้อมูลเดิมในเบราว์เซอร์ก่อน' : 'ใช้ข้อมูลจากเครื่องนี้เป็นข้อมูลบัญชีสำหรับเว็บและแอป? จะเก็บสำเนาทั้งสองชุดไว้ก่อน')) { show('เลือกข้อมูลที่จะเชื่อมกับบัญชี ข้อมูลเดิมยังอยู่', true); return; }
    backup(local, result.value); baseline = contentKey(result.value); connected = true;
    if (source === 'cloud') { apply(result.value ?? config.empty()); remember(); show('ซิงก์กับบัญชีแล้ว'); }
    else await enqueue(local ?? config.empty());
  }
  function enqueue(value) {
    const uid = account?.uid, version = epoch, selected = config;
    const copy = PointyLogic.cleanFirestoreData(JSON.parse(JSON.stringify(value)));
    const save = async () => {
      if (!connected || version !== epoch || currentUid() !== uid) return;
      show('กำลังบันทึกกับบัญชี…');
      try {
        await PointyFirebase.firestore().runTransaction(async tx => {
          if (currentUid() !== uid || version !== epoch) throw new Error('บัญชีเปลี่ยน กรุณาเปิดใหม่');
          const user = await tx.get(PointyFirebase.firestore().collection('users').doc(uid));
          if (!user.exists || blocked(user.data().status) || blocked(user.data().lifecycleStatus)) throw new Error('บัญชีไม่พร้อมใช้งาน');
          const ref = PointyFirebase.firestore().collection('playerModules').doc(uid); const snap = await tx.get(ref);
          if (currentUid() !== uid || version !== epoch) throw new Error('บัญชีเปลี่ยน กรุณาเปิดใหม่');
          if (contentKey(snap.data()?.[selected.field]) !== baseline) throw new Error('ข้อมูลบัญชีเปลี่ยนจากอีกเครื่อง กรุณาเลือกชุดข้อมูลก่อนบันทึกต่อ');
          tx.set(ref, { uid, characterId: account.character?.id || account.characterId || '', schemaVersion: 2, [selected.field]: copy, updatedAt: PointyFirebase.serverTimestamp() }, { mergeFields: ['uid', 'characterId', 'schemaVersion', selected.field, 'updatedAt'] });
        });
        if (version !== epoch) return;
        baseline = contentKey(copy); remember(copy); show('บันทึกกับบัญชีแล้ว ✓');
        window.dispatchEvent(new CustomEvent('pointy-module-synced', { detail: { uid, field: selected.field, value: copy } }));
      } catch (error) { if (version === epoch) { connected = false; show(`${error.message || 'บันทึกไม่สำเร็จ'} · ข้อมูลในเครื่องยังอยู่`, true); } throw error; }
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
        show('ข้อมูลเครื่องนี้เปลี่ยนระหว่างตรวจข้อมูลบัญชี กรุณาเลือกชุดที่จะใช้', true); return;
      }
      const meta = PointyScope.getJSON(metaKey, {}, { account })[config.field];
      const remembered = typeof meta === 'string' ? meta : meta?.local;
      const cloudKey = contentKey(result.value); const localKey = contentKey(local);
      baseline = cloudKey;
      if (local !== null && localKey !== cloudKey && remembered !== localKey) {
        connected = false; show('ข้อมูลเครื่องนี้ต่างจากข้อมูลบัญชี เลือกชุดที่จะใช้ก่อนซิงก์', true); return;
      }
      if (local !== null && result.value === undefined && !remembered) {
        connected = false; show('มีข้อมูลเดิมในเครื่องนี้ เลือกเชื่อมกับบัญชีเพื่อใช้ร่วมกับแอป', true); return;
      }
      connected = true;
      if (result.value !== undefined) { if (local !== null && localKey !== cloudKey) backup(local, result.value); apply(result.value); }
      else apply(config.empty());
      remember(); show('ซิงก์กับบัญชีแล้ว');
    } catch (error) { if (version === epoch) { connected = false; show(`${error.message || 'เชื่อมต่อไม่สำเร็จ'} · ข้อมูลในเครื่องยังอยู่`, true); } }
  }
  window.addEventListener('pointy-auth-changed', event => {
    if (!event.detail?.signedIn) { epoch++; connected = false; account = null; panel?.remove(); panel = null; return; }
    if (account?.uid !== event.detail.uid) void connect();
    else account = PointyScope.readAuth();
  });
  window.addEventListener('pointy-scoped-data-changed', event => {
    if (applying || testMode || !config || event.detail?.base !== config.key || !account || event.detail.accountKey !== PointyScope.accountKey(account)) return;
    if (connected) void enqueue(event.detail.value).catch(() => {});
    else show('เก็บในเครื่องแล้ว · ยังไม่ได้ซิงก์กับบัญชี', true);
  });
  window.PointyModuleCloud = { register(next) { config = next; void connect(); } };
})();
