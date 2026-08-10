const rawPageConfig = window.PAGE_CONFIG || {};
const supportedPlatforms = Object.freeze(['youtube', 'twitch', 'twitcast']);
const configuredPlatforms = Array.isArray(rawPageConfig.platforms)
	? rawPageConfig.platforms.filter(platform => supportedPlatforms.includes(platform))
	: supportedPlatforms;
const PAGE_CONFIG = Object.freeze({
	title: typeof rawPageConfig.title === 'string' ? rawPageConfig.title : '',
	heading: typeof rawPageConfig.heading === 'string' ? rawPageConfig.heading : '',
	agency: typeof rawPageConfig.agency === 'string' ? rawPageConfig.agency : '',
	platforms: Object.freeze(configuredPlatforms.length > 0
		? [...new Set(configuredPlatforms)]
		: [...supportedPlatforms]),
	hasPlatformConfiguration: Array.isArray(rawPageConfig.platforms),
	apiUrl: typeof rawPageConfig.apiUrl === 'string' ? rawPageConfig.apiUrl : '',
	relativeBasePath: typeof rawPageConfig.relativeBasePath === 'string'
		? rawPageConfig.relativeBasePath
		: '',
});

const container = document.getElementById('schedule-container');
const headerOffset = 140;
const settingsSheet = document.getElementById('settings-sheet');
const settingsScrim = document.getElementById('settings-scrim');
const settingsOpenButton = document.getElementById('open-settings');
const darkThemeToggle = document.getElementById('dark-theme-toggle');
const shareDialog = document.getElementById('share-dialog');
const shareDialogCloseButton = document.getElementById('close-share-dialog');
const shareOnXLink = document.getElementById('share-on-x');
const shareOnBlueskyLink = document.getElementById('share-on-bluesky');
const shareUrlInput = document.getElementById('share-url');
const shareCopyButton = document.getElementById('copy-share-url');
const shareStatus = document.getElementById('share-status');

let currentStatus = 'all';
let hideArchivedInAll = localStorage.getItem('hide-archived-in-all') === 'true';
let currentPlatform = 'all';
let currentSize = localStorage.getItem('thumb-size') || 'md';
let currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
let i18n = null;
let localizedTags = null;
let allSchedules = [];
let isUpdating = false;
let isLicenseContentLoaded = false;
let lastShareTrigger = null;

function createSiteUrl(relativePath)
{
	return `${PAGE_CONFIG.relativeBasePath}${String(relativePath).replace(/^\/+/, '')}`;
}

async function loadLocalizeFile(languageFilePath, fallbackFilePath)
{
	try {
		const response = await fetch(languageFilePath);
		if (!response.ok)
			throw new Error();
		return await response.json();
	}
	catch {
		const response = await fetch(fallbackFilePath);
		return await response.json();
	}
}

function getLocalizedTag(tag)
{
	return localizedTags?.[tag] ?? tag;
}

async function init()
{
	applySize(currentSize);
	applyTheme(currentTheme);

	const browserLang = (navigator.language || navigator.userLanguage).split('-')[0];
	i18n = await loadLocalizeFile(
		createSiteUrl(`locales/${browserLang}.json`),
		createSiteUrl('locales/en.json')
	);
	localizedTags = await loadLocalizeFile(
		createSiteUrl(`groups/${browserLang}/tags.json`),
		createSiteUrl('groups/en/tags.json')
	);

	const statusFilterGroup = document.getElementById('status-filter-group');

	document.title = PAGE_CONFIG.title || i18n.title;

	const pageTitle = document.getElementById('page-title');
	if (pageTitle)
		pageTitle.textContent = PAGE_CONFIG.heading || i18n.title;

	document.querySelectorAll('[data-i18n]').forEach(element =>
	{
		const key = element.getAttribute('data-i18n');
		if (i18n[key])
			element.textContent = i18n[key];
	});

	document.querySelectorAll('[data-i18n-aria-label]').forEach(element =>
	{
		const key = element.getAttribute('data-i18n-aria-label');
		if (i18n[key])
			element.setAttribute('aria-label', i18n[key]);
	});

	const statusFilterButtonSelector = '.filter-group-btn';
	statusFilterGroup.querySelectorAll(statusFilterButtonSelector).forEach(btn =>
	{
		btn.onclick = () =>
		{
			currentStatus = btn.getAttribute('data-status');
			statusFilterGroup.querySelectorAll(statusFilterButtonSelector).forEach(b => b.classList.remove('active'));
			btn.classList.add('active');
			renderFiltered(false, true);
		};
	});

	const hideArchivedToggle = document.getElementById('hide-archived-toggle');
	if (hideArchivedToggle) {
		hideArchivedToggle.checked = hideArchivedInAll;
		hideArchivedToggle.onchange = () => {
			hideArchivedInAll = hideArchivedToggle.checked;
			localStorage.setItem('hide-archived-in-all', String(hideArchivedInAll));
			renderSettingsSummary();
			renderFiltered(false, true);
		};
	}

	if (darkThemeToggle) {
		darkThemeToggle.checked = currentTheme === 'dark';
		darkThemeToggle.onchange = () => {
			applyTheme(darkThemeToggle.checked ? 'dark' : 'light');
		};
	}

	bindSettingsSheetEvents();
	bindShareDialogEvents();
	renderSettingsSummary();
	await updateData(true);
}

function bindSettingsSheetEvents()
{
	if (settingsOpenButton) {
		settingsOpenButton.onclick = () => openSettingsSheet();
	}

	if (settingsScrim) {
		settingsScrim.onclick = () => closeSettingsSheet();
	}

	document.querySelectorAll('.nav-row').forEach(row => {
		row.onclick = () => showSettingsView(row.getAttribute('data-target-view'));
	});

	document.querySelectorAll('.settings-back-btn').forEach(btn => {
		if (btn.classList.contains('settings-close-btn')) {
			btn.onclick = () => closeSettingsSheet();
			return;
		}
		btn.onclick = () => showSettingsView(btn.getAttribute('data-back-to'));
	});

	document.querySelectorAll('.settings-row-toggle').forEach(row => {
		row.onclick = event => {
			const toggle = row.querySelector('.settings-native-toggle');
			if (!toggle)
				return;

			toggle.checked = !toggle.checked;
			toggle.dispatchEvent(new Event('change', { bubbles: true }));
		};
	});

	document.addEventListener('click', event => {
		const option = event.target.closest('.settings-option-row');
		if (!option)
			return;

		const setting = option.getAttribute('data-setting');
		const value = option.getAttribute('data-value');
		applySettingValue(setting, value);
	});

	document.addEventListener('keydown', event => {
		if (event.key === 'Escape' && settingsSheet && !settingsSheet.hidden) {
			closeSettingsSheet();
		}
	});
}

function openSettingsSheet()
{
	if (!settingsSheet || !settingsScrim)
		return;

	settingsSheet.hidden = false;
	settingsScrim.hidden = false;
	requestAnimationFrame(() => {
		settingsSheet.classList.add('open');
		settingsScrim.classList.add('open');
	});
	settingsOpenButton?.setAttribute('aria-expanded', 'true');
	showSettingsView('root');
}

function closeSettingsSheet()
{
	if (!settingsSheet || !settingsScrim)
		return;

	settingsSheet.classList.remove('open');
	settingsScrim.classList.remove('open');
	settingsOpenButton?.setAttribute('aria-expanded', 'false');
	window.setTimeout(() => {
		settingsSheet.hidden = true;
		settingsScrim.hidden = true;
		showSettingsView('root');
	}, 200);
}

function showSettingsView(viewName)
{
	document.querySelectorAll('.settings-sheet-view').forEach(view => {
		view.classList.toggle('active', view.getAttribute('data-view') === viewName);
	});

	if (viewName === 'license')
		void loadLicenseContent();
}

async function loadLicenseContent()
{
	if (isLicenseContentLoaded)
		return;

	const licenseContent = document.getElementById('license-content');
	if (!licenseContent)
		return;

	licenseContent.textContent = i18n.license_loading;

	try {
		const response = await fetch(createSiteUrl('licenses.txt'), {
			headers: {
				'Accept': 'text/plain',
			},
		});
		if (!response.ok)
			throw new Error(`HTTP ${response.status}`);

		licenseContent.textContent = await response.text();
		isLicenseContentLoaded = true;
	}
	catch (error) {
		licenseContent.textContent = i18n.license_load_error;
		console.error('Failed to load license information:', error);
	}
}

function applySettingValue(setting, value)
{
	switch (setting) {
		case 'size':
			applySize(value);
			break;
		default:
			return;
	}

	renderSettingsSummary();
	renderSettingsOptionSelection();
	showSettingsView('root');
}

function getSizeLabel(size)
{
	switch (size) {
		case 'sm':
			return 'S';
		case 'md':
			return 'M';
		case 'lg':
			return 'L';
		default:
			return size;
	}
}

function renderSettingsSummary()
{
	const sizeValue = document.getElementById('current-size-value');
	const archiveSwitch = document.getElementById('settings-archive-switch');
	const darkThemeSwitch = document.getElementById('settings-dark-theme-switch');

	if (sizeValue)
		sizeValue.textContent = getSizeLabel(currentSize);
	if (archiveSwitch)
		archiveSwitch.classList.toggle('on', hideArchivedInAll);
	if (darkThemeSwitch)
		darkThemeSwitch.classList.toggle('on', currentTheme === 'dark');
	if (darkThemeToggle)
		darkThemeToggle.checked = currentTheme === 'dark';
}

function renderSettingsOptionSelection()
{
	document.querySelectorAll('.settings-option-row').forEach(row => {
		const setting = row.getAttribute('data-setting');
		const value = row.getAttribute('data-value');
		let active = false;

		switch (setting) {
			case 'size':
				active = currentSize === value;
				break;
			case 'platform':
				active = currentPlatform === value;
				break;
		}

		row.classList.toggle('active', active);
	});
}

async function updateData(isInitial = false)
{
	if (isUpdating)
		return;

	isUpdating = true;
	try {
		const response = await fetch(PAGE_CONFIG.apiUrl, {
			headers: {
				'Accept': 'application/json',
			},
		});
		if (!response.ok)
			throw new Error();
		const scheduleData = await response.json();
		allSchedules = (scheduleData.all_schedules || []).sort((a, b) =>
			new Date(getDisplayTimeIso(a)) - new Date(getDisplayTimeIso(b))
		);
		updatePlatformFilters();
		renderSettingsSummary();
		renderSettingsOptionSelection();
		renderFiltered(isInitial, false);
	}
	catch (e) {
		if (isInitial) {
			container.innerHTML = `<p>${i18n.error_no_data}</p>`;
		}
		console.error('Failed to update data:', e);
	}
	finally {
		isUpdating = false;
	}
}

function renderFiltered(isInitial = false, isManualFilter = false)
{
	const filtered = allSchedules.filter(s =>
	{
		const matchStatus = (currentStatus === 'all' || s.status === currentStatus);
		const hideArchived = currentStatus === 'all' && hideArchivedInAll && s.status === 'archived';
		const matchAgency = s.agency === PAGE_CONFIG.agency;
		const schedulePlatform = normalizePlatform(s.platform);
		const matchPlatform = PAGE_CONFIG.platforms.includes(schedulePlatform)
			&& (currentPlatform === 'all' || schedulePlatform === currentPlatform);
		return matchStatus && !hideArchived && matchAgency && matchPlatform;
	});

	const target = renderSchedule(filtered, currentStatus, i18n);

	if (isInitial) {
		setTimeout(() => scrollToElement(target), 100);
	}
	else if (isManualFilter) {
		if (currentStatus === 'live') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
		else if (currentStatus === 'archived') {
			window.scrollTo({ bottom: 0, behavior: 'smooth' });
		}
		else {
			scrollToElement(target);
		}
	}
}

function renderSchedule(schedules, statusFilter, i18n)
{
	container.innerHTML = '';

	if (schedules.length === 0) {
		const emptyMessage = document.createElement('p');
		emptyMessage.textContent = i18n.no_schedules || i18n.error_no_data;
		container.appendChild(emptyMessage);
		return null;
	}

	let lastDate = '';
	let lastHour = -1;
	let currentGrid = null;
	let currentHourGroup = null;
	let targetCurrentHour = null;
	let targetLatestLive = null;
	let targetNextUpcoming = null;

	const now = new Date();
	const nowHour = now.getHours();
	const todayStr = now.toLocaleDateString(i18n.date_locale, { month: 'short', day: 'numeric', weekday: 'short' });

	schedules.forEach(schedule =>
	{
		const dateObj = new Date(getDisplayTimeIso(schedule));
		const dateStr = dateObj.toLocaleDateString(i18n.date_locale, { month: 'short', day: 'numeric', weekday: 'short' });
		const hour = dateObj.getHours();

		if (dateStr !== lastDate) {
			const section = document.createElement('section');
			section.className = 'day-section';
			const dayTitle = document.createElement('h2');
			dayTitle.className = 'day-title';
			dayTitle.textContent = dateStr;
			section.appendChild(dayTitle);
			container.appendChild(section);
			lastDate = dateStr;
			lastHour = -1;
			currentGrid = null;
		}

		const isLiveFilter = (statusFilter === 'live');
		if (!currentGrid || (!isLiveFilter && hour !== lastHour)) {
			const hourGroup = document.createElement('div');
			hourGroup.className = 'hour-group';

			if (!isLiveFilter) {
				const hourLabel = document.createElement('div');
				hourLabel.className = 'hour-label';
				hourLabel.textContent = `${hour}:00 〜`;
				hourGroup.appendChild(hourLabel);
			}

			const grid = document.createElement('div');
			grid.className = 'grid';
			hourGroup.appendChild(grid);

			container.lastElementChild.appendChild(hourGroup);
			currentGrid = grid;
			currentHourGroup = hourGroup;
			lastHour = hour;

			if (!isLiveFilter && dateStr === todayStr && hour === nowHour) {
				targetCurrentHour = hourGroup;
			}
			if (!targetNextUpcoming && dateObj > now) {
				targetNextUpcoming = hourGroup;
			}
		}

		if (schedule.status === 'live') {
			targetLatestLive = currentHourGroup;
		}

		const card = createScheduleCard(schedule, dateObj, i18n);
		currentGrid.appendChild(card);
	});

	return targetCurrentHour || targetLatestLive || targetNextUpcoming;
}

function bindShareDialogEvents()
{
	if (!shareDialog)
		return;

	shareDialogCloseButton?.addEventListener('click', closeShareDialog);
	shareDialog.addEventListener('click', event => {
		if (event.target === shareDialog)
			closeShareDialog();
	});
	shareDialog.addEventListener('close', () => {
		lastShareTrigger?.focus();
		lastShareTrigger = null;
	});
	shareCopyButton?.addEventListener('click', copyShareUrl);
}

function shouldUseNativeShare()
{
	return typeof navigator.share === 'function'
		&& window.matchMedia('(pointer: coarse)').matches;
}

async function shareSchedule(title, url, trigger)
{
	if (shouldUseNativeShare()) {
		const shareData = { title, text: title, url };
		try {
			if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData))
				throw new Error('Share data is not supported');
			await navigator.share(shareData);
			return;
		}
		catch (error) {
			if (error?.name === 'AbortError')
				return;
		}
	}

	openShareDialog(title, url, trigger);
}

function openShareDialog(title, url, trigger)
{
	if (!shareDialog || !shareUrlInput || !shareOnXLink || !shareOnBlueskyLink
		|| !shareCopyButton || !shareStatus)
		return;

	lastShareTrigger = trigger;
	shareUrlInput.value = url;
	shareOnXLink.href = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
	shareOnBlueskyLink.href = `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title}\n${url}`)}`;
	shareCopyButton.textContent = i18n.copy_link;
	shareStatus.textContent = '';

	if (typeof shareDialog.showModal === 'function')
		shareDialog.showModal();
	else
		shareDialog.setAttribute('open', '');
}

function closeShareDialog()
{
	if (!shareDialog)
		return;

	if (typeof shareDialog.close === 'function')
		shareDialog.close();
	else {
		shareDialog.removeAttribute('open');
		lastShareTrigger?.focus();
		lastShareTrigger = null;
	}
}

async function copyShareUrl()
{
	if (!shareUrlInput || !shareCopyButton || !shareStatus)
		return;

	let copied = false;
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(shareUrlInput.value);
			copied = true;
		}
		else {
			shareUrlInput.select();
			copied = tryLegacyCopy();
		}
	}
	catch {
		shareUrlInput.select();
		copied = tryLegacyCopy();
	}

	shareCopyButton.textContent = copied ? i18n.copied : i18n.copy_link;
	shareStatus.textContent = copied ? i18n.copied : i18n.copy_failed;
}

function tryLegacyCopy()
{
	try {
		return document.execCommand('copy');
	}
	catch {
		return false;
	}
}

function createScheduleCard(schedule, dateObj, i18n)
{
	// とりあえず要素を作って、そのあとカードとして統合する

	const text = schedule.title;
	const watchUrl = getWatchUrl(schedule);

	const card = document.createElement('div');
	card.className = `card ${schedule.status}`;

	const watchLink = document.createElement('a');
	watchLink.href = watchUrl;
	watchLink.target = '_blank';
	watchLink.rel = 'noopener noreferrer';
	watchLink.className = 'stream-thumbnail-link';

	const thumb = document.createElement('img');
	thumb.src = schedule.thumbnail;
	thumb.className = 'stream-thumbnail';
	thumb.loading = 'lazy';
	watchLink.appendChild(thumb);

	const platformIcon = document.createElement('img');
	platformIcon.className = 'platform-icon';
	platformIcon.src = getPlatformIconPath(schedule.platform);
	platformIcon.alt = getPlatformLabel(schedule.platform);
	platformIcon.title = getPlatformLabel(schedule.platform);
	watchLink.appendChild(platformIcon);

	card.appendChild(watchLink);

	const cardInner = document.createElement('div');
	cardInner.className = 'card-inner';
	cardInner.style.borderLeftColor = schedule.color;

	const time = document.createElement('div');
	time.className = 'card-time';
	const timeText = document.createElement('span');
	timeText.className = 'card-time-text';
	timeText.textContent = dateObj.toLocaleTimeString(i18n.date_locale, { hour: '2-digit', minute: '2-digit' });
	time.appendChild(timeText);

	const statusLabel = getStatusLabel(schedule.status, i18n);
	if (statusLabel) {
		const badge = document.createElement('span');
		badge.className = `stream-status ${schedule.status}`;
		badge.textContent = statusLabel;
		time.appendChild(badge);
	}

	const name = document.createElement('div');
	name.className = 'streamer-name';
	name.textContent = schedule.streamer_name;

	const metaRow = document.createElement('div');
	metaRow.className = 'card-meta-row';
	metaRow.appendChild(name);

	const title = document.createElement('div');
	title.className = 'stream-title';
	title.textContent = schedule.title;

	const cardFooter = document.createElement('div');
	cardFooter.className = 'card-footer';

	const shareButton = document.createElement('button');
	shareButton.type = 'button';
	shareButton.className = 'share-button';
	shareButton.textContent = i18n.share;
	shareButton.addEventListener('click', () => {
		shareSchedule(text, watchUrl, shareButton);
	});

	cardFooter.appendChild(shareButton);
	cardInner.appendChild(time);
	cardInner.appendChild(metaRow);
	cardInner.appendChild(title);
	cardInner.appendChild(cardFooter);
	card.appendChild(cardInner);

	return card;
}

function getDisplayTimeIso(schedule)
{
	return schedule.display_time_iso || schedule.start_time_iso || schedule.published_at_iso;
}

function getWatchUrl(schedule)
{
	if (schedule.url)
		return schedule.url;

	if (schedule.video_id)
		return `https://www.youtube.com/watch?v=${schedule.video_id}`;

	return '#';
}

function getPlatformIconPath(platform)
{
	switch (normalizePlatform(platform)) {
		case 'twitcast':
			return createSiteUrl('assets/icons/twitcast_icon.png');
		case 'twitch':
			return createSiteUrl('assets/icons/twitch_icon.png');
		case 'youtube':
		default:
			return createSiteUrl('assets/icons/youtube_icon.png');
	}
}

function getPlatformLabel(platform)
{
	switch (normalizePlatform(platform)) {
		case 'twitcast':
			return 'Twitcast';
		case 'twitch':
			return 'Twitch';
		case 'youtube':
		default:
			return 'YouTube';
	}
}

function normalizePlatform(platform)
{
	if (platform === 'twitcasting')
		return 'twitcast';

	return platform || 'youtube';
}

function getStatusLabel(status, i18n)
{
	switch (status) {
		case 'live':
			return i18n.filter_live;
		case 'upcoming':
			return i18n.filter_upcoming;
		case 'video':
			return i18n.label_video || i18n.filter_video;
		case 'archived':
			return i18n.filter_archived;
		default:
			return '';
	}
}

function updatePlatformFilters()
{
	const platformContainer = document.getElementById('platform-filter-group');
	if (!platformContainer)
		return;

	platformContainer.innerHTML = '';
	if (PAGE_CONFIG.hasPlatformConfiguration && PAGE_CONFIG.platforms.length === 1) {
		platformContainer.hidden = true;
		return;
	}

	platformContainer.hidden = false;
	platformContainer.appendChild(createHeaderFilterButton(i18n.filter_all || 'All', currentPlatform === 'all', () => {
		currentPlatform = 'all';
		updatePlatformFilters();
		renderFiltered(false, true);
	}));
	const platformLabels = {
		youtube: i18n.platform_youtube || 'YouTube',
		twitch: i18n.platform_twitch || 'Twitch',
		twitcast: i18n.platform_twitcast || 'Twitcast',
	};
	PAGE_CONFIG.platforms.forEach(platform => {
		platformContainer.appendChild(createHeaderFilterButton(platformLabels[platform], currentPlatform === platform, () => {
			currentPlatform = platform;
			updatePlatformFilters();
			renderFiltered(false, true);
		}));
	});
}

function createSettingsOptionButton(setting, value, label)
{
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'settings-option-row';
	btn.setAttribute('data-setting', setting);
	btn.setAttribute('data-value', value);

	const text = document.createElement('span');
	text.textContent = label;
	const check = document.createElement('span');
	check.className = 'settings-check';
	check.textContent = '✓';

	btn.appendChild(text);
	btn.appendChild(check);
	return btn;
}

function createHeaderFilterButton(label, isActive, onClick)
{
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'filter-group-btn';
	btn.textContent = label;
	btn.classList.toggle('active', isActive);
	btn.onclick = onClick;
	return btn;
}

function applySize(size)
{
	currentSize = size;
	localStorage.setItem('thumb-size', size);
	container.className = `size-${size}`;
	renderSettingsSummary();
	renderSettingsOptionSelection();
	showSettingsView('root');
}

function applyTheme(theme)
{
	currentTheme = theme;
	localStorage.setItem('theme', theme);
	document.documentElement.classList.toggle('dark', theme === 'dark');
	renderSettingsSummary();
}

function scrollToElement(element)
{
	const pos = element
		? element.getBoundingClientRect().top + window.pageYOffset - headerOffset
		: 0;
	window.scrollTo({ top: pos, behavior: 'smooth' });
}

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register(
			createSiteUrl('sw.js')
		).catch(error => {
			console.error('ServiceWorker registration failed:', error);
		});
	});
}

window.addEventListener('DOMContentLoaded', init);

