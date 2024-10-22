<script lang="js">
	// @ts-nocheck
	import Icon from '@iconify/svelte';
	import * as go from 'gojs';
	import { afterUpdate, onMount } from 'svelte';
	import Papa from 'papaparse';

	import { fileStore } from '$lib/stores/fileStore';

	// drawers
	let nodeDrawer = false;
	let settingsDrawer = false;
	$: if (nodeDrawer) editContact();

	let openNames = false;

	const cForm = {
		pic: '',
		name: '',
		surname: '',
		prefix: '',
		suffix: '',
		nickname: '',
		born: '',
		died: '',
		position: ''
	};

	let card_w = 200;

	let diagram;
	let FamCoTree;

	let nodeDataArray = [];
	let linkDataArray = [];
	let selectedFile;
	let selectedNodes = 0;
	let selectedNode;

	let qrCodeUrl;
	let fileLink;
	let loading = false;

	// settings
	let darkMode = false;
	let diagramColor = '#A5A4F4'; //'#0000FF1A'; //'#A5A4F4'; //rgba(0,0,255,0.1)
	let diagramColorH = lightenColor('#A5A4F4', 20);
	let diagramColorV = lightenColor('#A5A4F4', 35);
	let diagramContactStyle;
	let diagramRelationStlye;
	let lockUID = true;
	let autoUpdateUID = true;

	let nodeCount = 0;
	let linkCount = 0;

	onMount(() => {
		// layout: new go.GridLayout({ angle: 90, layerSpacing: 50, nodeSpacing: 200 })
		const $ = go.GraphObject.make;
		diagram = $(go.Diagram, FamCoTree, {
			'undoManager.isEnabled': true
		});

		diagram.toolManager.draggingTool.isGridSnapEnabled = true;
		diagram.toolManager.linkingTool.isEnabled = true;
		diagram.model.undoManager.isEnabled = true;
		diagram.layout.isOngoing = false;
		diagram.isReadOnly = false;
		//diagram.toolManager.textEditingTool.acceptText(go.TextEditingTool.LostFocus);

		diagram.grid = new go.Panel('Grid', { gridCellSize: new go.Size(card_w, 100) }).add(
			new go.Shape('BarV', {
				name: 'BarV',
				fill: diagramColorV,
				width: card_w,
				portId: '',
				cursor: 'pointer'
			}),
			new go.Shape('BarH', { name: 'BarH', fill: diagramColorH, height: 50 })
		);

		diagram.nodeTemplate = $(
			go.Node,
			'Auto',
			{
				width: card_w,
				height: 50,
				toolTip: go.GraphObject.build('ToolTip').add(
					new go.TextBlock({ margin: 4 }).bind('text', 'name')
				),
				doubleClick: () => {
					nodeDrawer = true;
				}
			},
			new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify)
		)
			//.bind('location', 'loc', go.Point.parse) // avoid; 12 hours wasted
			.add(
				new go.Shape('RoundedRectangle', {
					fill: diagramColor,
					portId: '',
					fromLinkable: true,
					toLinkable: true
				}).bind('fill', 'color'),
				new go.Panel('Table', { stretch: go.Stretch.Fill, margin: 0 })
					.addColumnDefinition(0, {
						sizing: go.Sizing.None,
						background: 'white',
						coversSeparators: true
					})
					.addColumnDefinition(1, { separatorStroke: 'black' })
					.addRowDefinition(0, { sizing: go.Sizing.None })
					.addRowDefinition(1, { separatorStroke: 'black' })
					.add(
						$(
							go.Picture,
							{
								row: 0,
								column: 0,
								background: 'black',
								rowSpan: 2,
								width: 44,
								height: 44,
								margin: 0
							},
							new go.Binding('source', 'pic').makeTwoWay()
						),
						$(
							go.TextBlock,
							{
								width: 150,
								editable: false,
								font: 'bold 11pt helvetica',
								row: 0,
								column: 1,
								columnSpan: 3,
								stretch: go.Stretch.Horizontal,
								margin: new go.Margin(1, 0, 0, 0), // Remove extra margin
								textAlign: 'center',
								verticalAlignment: go.Spot.Bottom,
								wrap: go.TextBlock.WrapFit,
								maxSize: new go.Size(150, NaN),
								isMultiline: true
							},
							//new go.Binding('text', 'name').makeTwoWay()
							new go.Binding('text', '', (data) => data.name + ' ' + data.surname).makeTwoWay(
								(text, data) => {
									const [name, surname] = text.split(' ');
									data.name = name;
									data.surname = surname;
									return data;
								}
							)
						),
						$(
							go.TextBlock,
							{
								width: 50,
								editable: false,
								row: 1,
								column: 1,
								font: '9pt helvetica',
								stretch: go.Stretch.Horizontal,
								margin: 0,
								textAlign: 'right'
							},
							new go.Binding('text', 'born', (date) =>
								date ? new Date(date).getFullYear() : ''
							).makeTwoWay((year, data) => {
								return data.born
									? (new Date(data.born).setFullYear(year),
										new Date(data.born).toISOString().split('T')[0])
									: '';
							})
						),
						$(go.TextBlock, {
							width: 50,
							text: '-',
							row: 1,
							column: 2,
							font: '9pt helvetica',
							stretch: go.Stretch.Horizontal,
							margin: 0,
							textAlign: 'center'
						}),
						$(
							go.TextBlock,
							{
								width: 50,
								editable: false,
								row: 1,
								column: 3,
								font: '9pt helvetica',
								stretch: go.Stretch.Horizontal,
								margin: 0,
								textAlign: 'left'
							},
							//new go.Binding('text', 'born').makeTwoWay()
							new go.Binding('text', 'died', (date) =>
								date ? new Date(date).getFullYear() : ''
							).makeTwoWay((year, data) => {
								return data.died
									? (new Date(data.died).setFullYear(year),
										new Date(data.died).toISOString().split('T')[0])
									: '';
							})
						)
					)
			);

		diagram.linkTemplate = new go.Link({
			routing: go.Routing.AvoidsNodes,
			curve: go.Curve.Bezier,
			corner: 5,
			relinkableFrom: true,
			relinkableTo: true,
			fromPortId: ''
		}).add(
			new go.Shape(),
			new go.Shape({ toArrow: 'Standard' }),
			new go.TextBlock('Relation', {
				segmentOffset: new go.Point(0, -10),
				segmentOrientation: go.Orientation.Upright,
				editable: true
			}).bind(new go.Binding('text', 'text').makeTwoWay())
		);

		function diagramInfo(model) {
			return (
				'Tree:\n' +
				model.nodeDataArray.length +
				' Contacts, ' +
				model.linkDataArray.length +
				' Relations'
			);
		}

		// provide a tooltip for the background of the Diagram, when not over any Part
		diagram.toolTip = go.GraphObject.build('ToolTip').add(
			new go.TextBlock({ margin: 4 })
				// use a converter to display information about the diagram model
				.bind('text', '', diagramInfo)
		);

		diagram.addDiagramListener('ChangedSelection', (e) => {
			selectedNode = diagram.selection.first();
			selectedNodes = diagram.selection.count;
		});

		fileStore.subscribe((value) => {
			selectedFile = value;
		});

		if (selectedFile) {
			Papa.parse(selectedFile, {
				header: true,
				skipEmptyLines: true,
				complete: function (results) {
					console.log('Parsed CSV data:', results.data); // Parsed CSV data

					// Sort the data by year of birth
					results.data.sort((a, b) => {
						const yearA = extractYear(a.Birthday); // Assuming Birthday is the correct field
						const yearB = extractYear(b.Birthday);
						return yearA - yearB; // Sort in ascending order
					});

					importCSV(results.data); // Pass the sorted data to createGoJSData
					fileStore.set(null);
				}
			});
		} else {
			console.log('loadDiagramFromLocalStorage');
			loadDiagramFromLocalStorage();
		}

		diagram.addModelChangedListener((e) => {
			if (e.isTransactionFinished) {
				console.log(JSON.parse(diagram.model.toJson())['nodeDataArray']);
				const model = JSON.parse(diagram.model.toJson());
				nodeCount = diagram.model.nodeDataArray.length;
				linkCount = diagram.model.linkDataArray.length;

				if (model['nodeDataArray'].length !== 0) {
					console.log('not empty');
					saveDiagramToLocalStorage(); // Save model after each transaction (i.e., modification)
				} else {
					console.log('empty');
				}

				//saveDiagramToLocalStorage(); // Save model after each transaction (i.e., modification)
			}
		});

		///console.log('>>>', nodeDataArray);
		//diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
		//diagram.requestUpdate();
	}); // onMount ------------------------------------------------------------------------------------

	function saveContact() {
		diagram.model.startTransaction('edit contact');
		selectedNode.data.name = cForm.name;
		selectedNode.data.surname = cForm.surname;

		selectedNode.data.born = cForm.born;
		selectedNode.data.died = cForm.died;

		updateAllUids();
		selectedNode.data.key = cForm.key;

		diagram.model.updateTargetBindings(selectedNode.data);
		diagram.model.commitTransaction('edit contact');

		nodeDrawer = false;
	}

	function updateAllUids() {
		const model = diagram.model;
		const oldKey = selectedNode.data.key;
		const newKey = cForm.key;
		console.log('old', oldKey);
		console.log('new', newKey);

		model.linkDataArray.forEach((linkData) => {
			if (linkData.from === oldKey) {
				model.setDataProperty(linkData, 'from', newKey);
			}

			if (linkData.to === oldKey) {
				model.setDataProperty(linkData, 'to', newKey);
			}
		});
	}

	const saveDiagramToLocalStorage = () => {
		//diagram.rebuildParts();
		const modelAsJson = diagram.model.toJson(); // Convert model to JSON string
		console.log('SaveDiagram', modelAsJson);
		localStorage.setItem('myDiagramModel', modelAsJson); // Save the model in localStorage
	};

	// Function to load the diagram model from localStorage on reload
	const loadDiagramFromLocalStorage = () => {
		const savedModel = localStorage.getItem('myDiagramModel'); // Retrieve the model from localStorage

		if (savedModel) {
			console.log('loadFromlocal YES');

			diagram.model = go.Model.fromJson(savedModel); // Load the saved model into the diagram
		} else {
			console.log('loadFromlocal NO');
		}
	};

	function removeContact() {
		console.log('removeContact');
		diagram.commandHandler.deleteSelection();
	}

	function addContact() {
		console.log('addContact', isFree(0, 0));

		diagram.model.startTransaction('add contact');
		diagram.model.addNodeData({
			pic: 'https://famcotree.danielthecyberdude.com/Avatar.webp', //'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp',
			name: 'New',
			surname: 'Contact',
			born: '',
			died: '',
			key: 'new_contact_' + generateRandomYear(),
			loc: nextFreeLocH()
		});
		diagram.model.commitTransaction('add contact');
	}

	function editContact() {
		console.log('Edit node (fillit)');
		const data = diagram.selection.first().data;
		console.log(data.name, data.died);
		cForm.pic = data.pic;
		cForm.name = data.name;
		cForm.surname = data.surname;
		cForm.born = data.born;
		cForm.died = data.died;

		cForm.key = data.key;
		cForm.position = data.loc
			.split(' ')
			.map((v, i) => `${i === 0 ? 'X' : 'Y'}: ${v}`)
			.join('         ');
		console.log(data.loc.split(' '));
	}

	function removeAllRelations() {
		console.log('removeAllContacts');
		diagram.startTransaction('remove all relations');
		diagram.model.linkDataArray = [];
		diagram.commitTransaction('remove all relations');
		saveDiagramToLocalStorage();
	}

	function removeAllContacts() {
		console.log('removeAllContacts');
		diagram.startTransaction('remove all contacts');
		diagram.model.nodeDataArray = [];
		diagram.model.linkDataArray = [];
		diagram.commitTransaction('remove all contacts');
		saveDiagramToLocalStorage();
	}

	function lightenColor(hex, percent) {
		// Convert HEX to RGB
		let r = parseInt(hex.slice(1, 3), 16);
		let g = parseInt(hex.slice(3, 5), 16);
		let b = parseInt(hex.slice(5, 7), 16);

		// Calculate the amount to lighten each color component
		r = Math.min(255, Math.floor(r + r * (percent / 100)));
		g = Math.min(255, Math.floor(g + g * (percent / 100)));
		b = Math.min(255, Math.floor(b + b * (percent / 100)));

		// Convert back to HEX
		return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
	}

	const updateDiagramColor = (event) => {
		diagramColor = event.target.value; // Update the reactive variable

		diagram.model.nodeDataArray.forEach((nodeData) => {
			diagram.model.setDataProperty(nodeData, 'color', diagramColor);
		});

		diagram.grid.findObject('BarH').fill = lightenColor(diagramColor, 20);
		diagram.grid.findObject('BarV').fill = lightenColor(diagramColor, 35);
	};

	function changeRelationStyle() {
		diagram.startTransaction('change curve');
		diagram.links.each((link) => {
			link.curve = diagramRelationStlye; // Directly use selected curve
		});
		diagram.commitTransaction('change curve');
	}

	function isFree(x, y) {
		for (var i = 0; i < diagram.model.nodeDataArray.length; i++) {
			var nodeData = diagram.model.nodeDataArray[i];
			var node = diagram.findNodeForData(nodeData);

			if (node) {
				// Get the node's location
				var loc = node.location;
				// Check if the node's location is the same as (x, y)
				console.log(loc.x, loc.y);
				if (loc.x === x && loc.y === y) {
					return false; // Location is occupied
				}
			}
		}
		return true;
	}

	function printLoc() {
		var selectedNode = diagram.selection.first(); // Get the first selected node
		const nodeData = selectedNode.data;
		//diagram.model.startTransaction('edit');
		//diagram.model.setDataProperty(nodeData, 'name', 'danijel');
		//diagram.model.commitTransaction('edit');
		if (selectedNode !== null) {
			var location = selectedNode.location;
			console.log(location);
			console.log(selectedNode.name);
			console.log(diagram.model.nodeDataArray);
		}
	}

	/* nodeDataArray = [
				{
					key: 'Dmitar_Petrović_1232',
					born: 1992,
					died: 2000,
					name: 'Dmitar Petrović',
					from: true,
					to: true,
					loc: '0 -100'
				},
				{
					key: 'Danica_Petrović_1111',
					born: 1992,
					died: 2000,
					name: 'Danica Petrović',
					from: true,
					to: true,
					loc: '400 -100'
				},
				{
					key: 'Milan_Petrović_1111',
					born: 1992,
					died: 2000,
					name: 'Milan Petrović Đedoslav',
					from: true,
					to: true,
					loc: '200 -200'
				}
			];
			linkDataArray = [
				{ from: 'Dmitar_Petrović_1232', to: 'Danica_Petrović_1111', text: 'Spouse' },
				{ from: 'Danica_Petrović_1111', to: 'Dmitar_Petrović_1232', text: 'Spouse' },
				{ from: 'Dmitar_Petrović_1232', to: 'Milan_Petrović_1111', text: 'Child' }
			]; */

	function importCSV(data) {
		nodeDataArray = data.map(
			(contact) => (
				console.log(contact.Birthday),
				{
					pic: 'https://famcotree.danielthecyberdude.com/Avatar.webp', //'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp',
					name: contact['First Name'],
					surname: contact['Last Name'],
					born: contact.Birthday,
					died: contact['Event 1 - Value'], // Assuming death date is in Event 1 - Value
					key:
						contact['Custom Field 1 - Value'] ||
						`${contact['First Name']}_${contact['Last Name']}_${generateRandomYear()}`, // Use UID or generate one
					loc: '0 0' // import from file or "0 0"
				}
			)
		);

		linkDataArray = [];

		data.forEach((contact) => {
			for (let i = 1; i <= 4; i++) {
				const relationLabel = contact[`Relation ${i} - Label`];
				const relationValue = contact[`Relation ${i} - Value`];

				if (relationLabel && relationValue) {
					linkDataArray.push({
						from:
							contact['Custom Field 1 - Value'] ||
							`${contact['First Name']}_${contact['Last Name']}_${generateRandomYear()}`, // Use UID or generated one
						to: relationValue.trim(),
						text: relationLabel.trim()
					});
				}
			}
		});

		console.log('nodeDataArray:', nodeDataArray);
		console.log('linkDataArray:', linkDataArray);
		diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
	}

	async function shareQR() {
		console.log('shareQR');
		loading = true;

		const svgStr = new XMLSerializer().serializeToString(
			diagram.makeSvg({ scale: 1, background: 'white' })
		);
		const blob = new Blob([svgStr], { type: 'image/svg+xml' });
		const formData = new FormData();
		formData.append('file', blob, 'diagram.svg');

		try {
			const response = await fetch('https://file.io/?expires=1d', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();
			fileLink = data.link || ''; // Ensure fileLink is updated after upload
			qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fileLink)}`;
		} catch (error) {
			console.error('Upload failed:', error);
		} finally {
			loading = false;
		}
	}

	function downloadPNG() {
		const imageData = diagram.makeImageData({
			background: 'white', // optional: set background color
			scale: 1, // adjust the scaling factor (1 for 100%)
			maxSize: new go.Size(Infinity, Infinity) // adjust size if needed
		});
		console.log('downloadPNG');

		// Create a link element and trigger download
		const link = document.createElement('a');
		link.href = imageData;
		link.download = 'diagram.png'; // the file name for download
		link.click();
	}

	function downloadSVG() {
		const svg = diagram.makeSvg({
			scale: 1,
			background: 'white'
		});

		const serializer = new XMLSerializer();
		const svgStr = serializer.serializeToString(svg);

		const blob = new Blob([svgStr], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'diagram.svg';
		link.click();

		URL.revokeObjectURL(url); // clean up
	}

	function downloadCSV() {
		const nodeDataArray = diagram.model.nodeDataArray;
		const linkDataArray = diagram.model.linkDataArray;
		console.log('download');

		const csvRows = [];
		let headers = [
			'First Name',
			'Middle Name',
			'Last Name',
			'Phonetic First Name',
			'Phonetic Middle Name',
			'Phonetic Last Name',
			'Name Prefix',
			'Name Suffix',
			'Nickname',
			'File As',
			'Organization Name',
			'Organization Title',
			'Organization Department',
			'Birthday',
			'Notes',
			'Photo',
			'Labels',
			'Event 1 - Label',
			'Event 1 - Value',
			'Custom Field 1 - Label',
			'Custom Field 1 - Value',
			'loc' // Extra field for location
		];

		// Create a map to store relations for each node
		const relationsMap = {};

		// Populate relations map based on links where the node is the "from" key
		linkDataArray.forEach((link) => {
			const { from, text } = link;

			// Initialize relations array for the "from" node if it doesn't exist
			if (!relationsMap[from]) {
				relationsMap[from] = [];
			}

			// Add the relation for the "from" node
			relationsMap[from].push({ relation: text, relatedNode: link.to });
		});

		// Process node data and dynamically add headers for relations
		nodeDataArray.forEach((node) => {
			const { name, surname, key, loc, pic, born, died } = node;

			// Extract relations for the current node (only those where the node is "from")
			const relations = relationsMap[key] || [];

			// Dynamically add relation headers if new relations are found
			relations.forEach((_, index) => {
				if (!headers.includes(`Relation ${index + 1} - Label`)) {
					headers.push(`Relation ${index + 1} - Label`);
					headers.push(`Relation ${index + 1} - Value`);
				}
			});

			// Prepare the row for CSV
			const row = [
				name, // First Name
				'', // Middle Name
				surname, // Last Name
				'', // Phonetic First Name
				'', // Phonetic Middle Name
				'', // Phonetic Last Name
				'', // Name Prefix
				'', // Name Suffix
				'', // Nickname
				'', // File As
				'', // Organization Name
				'', // Organization Title
				'', // Organization Department
				born || '', // Birthday
				'', // Notes
				pic || '', // Photo
				'' // Labels
			];

			// Add event (if applicable)
			const event = died ? ['RIP', died] : ['', ''];
			row.push(...event);

			// Add UID (Custom Field 1)
			row.push('UID', key);

			// Add loc field
			row.push(loc);

			// Add dynamic relations in 'Relation X - Label' and 'Relation X - Value' format
			relations.forEach((relation) => {
				row.push(relation.relation, relation.relatedNode);
			});

			csvRows.push(row.join(','));
		});

		// Add the dynamically generated headers to the CSV
		csvRows.unshift(headers.join(','));

		// Create CSV string
		const csvString = csvRows.join('\n');

		// Trigger download
		const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', 'exported_contacts.csv');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function extractYear(dateString) {
		if (dateString) {
			const year = dateString.split('-')[0]; // Extracts year if date is in format YYYY-MM-DD
			return parseInt(year, 10);
		}
		return null;
	}

	function generateRandomYear() {
		return Math.floor(1000 + Math.random() * 9000); // Always generates a 4-digit number
	}

	function nextRandomLoc() {
		let x, y;
		do {
			x = Math.floor(Math.random() * 3) * 200; // Randomly choose from 0, 200, 400
			y = (Math.floor(Math.random() * 6) - 2) * 100; // Randomly choose from -200, -100, 0, 100, 200
		} while (!isFree(x, y)); // Ensure the location is free

		return `${x} ${y}`;
	}

	function nextFreeLocH(startX = 0, startY = 0, direction = 'right') {
		if (direction === 'right') {
			while (!isFree(startX, startY)) {
				startX += 400;
			}
		} else if (direction === 'left') {
			while (!isFree(startX, startY)) {
				startX -= 400;
			}
		}

		return `${startX} ${startY}`;
	}

	function nextFreeLocV(startX = 0, startY = 0, direction = 'up') {
		if (direction === 'up') {
			while (!isFree(startX, startY)) {
				startY -= 100;
			}
		} else if (direction === 'down') {
			while (!isFree(startX, startY)) {
				startY += 100;
			}
		}

		return `${startX} ${startY}`;
	}

	function populateNodeDrawer() {
		sidebarData = ['Item 1', 'Item 2', 'Item 3']; // Example data
		console.log('Sidebar opened and populated with data!');
	}

	function fixdUID() {
		if (autoUpdateUID) {
			console.log(cForm.key);
			cForm.key =
				cForm.name +
				'_' +
				cForm.surname +
				'_' +
				(cForm.born !== '' ? new Date(cForm.born).getFullYear() : generateRandomYear());
		}
	}

	afterUpdate(() => {
		if (diagram) {
			diagram.requestUpdate();
		}
	});
</script>

<div class="navbar absolute z-50 bg-base-100 pb-3">
	<div class="navbar-start">
		<label
			for="node-drawer"
			class="btn btn-circle btn-ghost {selectedNodes !== 1 ? 'btn-disabled' : ''}"
			><Icon icon="mdi:edit" /></label
		>
		<button on:click={addContact} class="btn btn-circle btn-ghost">
			<Icon icon="mdi:plus" />
		</button>

		<button on:click={removeContact} disabled={!selectedNodes} class="btn btn-circle btn-ghost">
			<Icon icon="mdi:minus" />
		</button>
	</div>
	<a href="/" class="btn btn-ghost navbar-center">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="1.5em"
			height="1.5em"
			viewBox="0 0 24 24"
			{...$$props}
		>
			<path
				fill="currentColor"
				d="M12 0h-.079c-1.66 0-3.239.349-4.667.978l.074-.029A12.3 12.3 0 0 0 3.52 3.523A12.2 12.2 0 0 0 .978 7.251l-.031.079A11.4 11.4 0 0 0 0 11.919v.086v-.004v.079c0 1.66.349 3.239.978 4.667l-.029-.074a12.3 12.3 0 0 0 2.572 3.807a12.2 12.2 0 0 0 3.729 2.542l.079.031c1.354.6 2.933.949 4.593.949h.083h-.004h.079c1.66 0 3.239-.349 4.667-.978l-.074.029a12.3 12.3 0 0 0 3.809-2.573a12.2 12.2 0 0 0 2.542-3.728l.031-.079c.6-1.354.949-2.932.949-4.593v-.158c0-1.66-.349-3.239-.978-4.667l.029.074a12.3 12.3 0 0 0-2.573-3.806A12.2 12.2 0 0 0 16.754.981L16.675.95C15.321.35 13.741 0 12.08 0h-.083zm.64 22.79v-2.087l5.193-2.633a.4.4 0 0 0 .154-.129l.001-.001a.34.34 0 0 0 .059-.191v-.011v.001v-1.186c.225-.082.412-.226.543-.412l.002-.004c.133-.179.214-.404.214-.648v-.118a1.15 1.15 0 0 0-.366-.746l-.001-.001a1.1 1.1 0 0 0-.75-.297h-.022h.001h-.02c-.308 0-.587.127-.786.332c-.205.2-.332.478-.332.787v.021v-.001v.059q.004.045.024.081v-.001c.013.222.096.423.227.583l-.001-.002c.133.163.304.289.501.364l.008.003v.949l-4.649 2.372v-1.942l2.039-.949a.5.5 0 0 0 .166-.13l.001-.001a.3.3 0 0 0 .071-.194v-3.233l3.793-2.134a.32.32 0 0 0 .142-.141l.001-.002a.4.4 0 0 0 .047-.189v-.901c.223-.079.409-.218.543-.397l.002-.003c.133-.177.214-.401.214-.644v-.04c0-.308-.127-.587-.332-.786a1.07 1.07 0 0 0-.775-.332H18.4a1.08 1.08 0 0 0-.71.366l-.001.001a1.1 1.1 0 0 0-.285.746v.025v-.001v.02c0 .243.08.466.216.646l-.002-.003c.137.182.322.321.538.397l.008.003v.688l-3.818 2.134a.5.5 0 0 0-.129.129l-.001.002a.34.34 0 0 0-.055.184v.017v-.001v3.2l-1.52.711v-6.972l3.2-1.566a.4.4 0 0 0 .153-.141l.001-.002a.35.35 0 0 0 .059-.189V7.04c.223-.079.409-.218.543-.397l.002-.003c.133-.177.214-.401.214-.644v-.021v.001v-.061a.08.08 0 0 0-.024-.057a1.13 1.13 0 0 0-.366-.719l-.001-.001a1.06 1.06 0 0 0-.738-.297h-.128a1.1 1.1 0 0 0-.719.378l-.001.001a1.1 1.1 0 0 0-.297.754v.123c.032.227.12.428.251.596l-.002-.003c.127.167.301.291.502.354l.007.002v.972l-2.656 1.304V5.288c.225-.082.412-.226.543-.412l.002-.004c.133-.179.214-.404.214-.648V4.2c0-.308-.127-.587-.332-.786a1.1 1.1 0 0 0-.787-.332h-.021h.001h-.02c-.308 0-.587.127-.786.332c-.205.2-.332.478-.332.787v.021v-.001v.118c.03.223.119.421.25.583l-.002-.002c.133.163.304.289.501.364l.008.003v6.569l-1.874-.996V7.865a.3.3 0 0 0-.048-.16l.001.001a1 1 0 0 0-.095-.119l-1.306-.998a.8.8 0 0 0 .07-.196l.001-.006q.023-.102.024-.222v-.024c0-.308-.127-.587-.332-.786a1.1 1.1 0 0 0-.786-.331H7.52h.001h-.02c-.308 0-.587.127-.786.332c-.205.2-.332.478-.332.787v.021v-.001v.024c0 .305.125.581.326.78c.2.205.478.332.787.332h.021h-.001h.015a.9.9 0 0 0 .288-.049l-.006.002c.11-.041.2-.081.287-.125l-.015.007l1.162.925v3.035a.3.3 0 0 0 .06.178l-.001-.001a.4.4 0 0 0 .152.129l.002.001l2.419 1.28V15.1l-4.055-1.874l.071-1.47v-.024a.3.3 0 0 0-.06-.178l.001.001a.4.4 0 0 0-.152-.129l-.002-.001l-1.851-.97a.5.5 0 0 0 .024-.157v-.2a1.13 1.13 0 0 0-.366-.719l-.001-.001a1.1 1.1 0 0 0-.752-.299h-.018h.001h-.007c-.305 0-.58.127-.775.332c-.208.2-.338.481-.338.792v.015v-.001v.118c.029.285.164.534.366.71l.001.001c.193.177.451.285.735.285h.131a1.5 1.5 0 0 0 .33-.083l-.01.003q.155-.06.275-.156l-.002.002l1.707.88l-.047 1.47v.008q0 .113.048.208l-.001-.003a.3.3 0 0 0 .164.142l.002.001l4.577 2.134v6.869q-.308 0-.605-.024l-.605-.047l.071-4.364a.35.35 0 0 0-.06-.191l.001.001a.36.36 0 0 0-.175-.142l-.002-.001l-2.87-1.328v-.125c0-.305-.127-.58-.332-.775a1.1 1.1 0 0 0-.787-.332H6.49h.001h-.114a1.08 1.08 0 0 0-.71.366l-.001.001a1.1 1.1 0 0 0-.285.746v.025v-.001v.007c0 .305.127.58.332.775c.195.205.47.332.775.332h.039q.236-.001.439-.094l-.007.003q.209-.1.369-.242l-.002.002l2.656 1.21v4.008a10.6 10.6 0 0 1-3.534-1.343l.048.027a10.9 10.9 0 0 1-2.773-2.354l-.014-.017a11.1 11.1 0 0 1-1.824-3.112l-.026-.076a10.3 10.3 0 0 1-.676-3.699v-.111c0-1.494.314-2.915.88-4.201l-.026.067a11.1 11.1 0 0 1 2.324-3.44A11 11 0 0 1 7.73 2.065l.071-.028a10.3 10.3 0 0 1 4.139-.856h.061h-.003h.064c1.494 0 2.915.314 4.201.88l-.067-.026a11.1 11.1 0 0 1 3.44 2.32a11 11 0 0 1 2.296 3.369l.028.071c.54 1.218.854 2.639.854 4.134v.067v-.003v.064c0 1.444-.292 2.82-.82 4.072l.026-.069a11.1 11.1 0 0 1-2.175 3.373l.005-.006a10.9 10.9 0 0 1-3.172 2.32l-.065.028c-1.16.568-2.516.932-3.948 1.009l-.026.001z"
			/>
		</svg>
		<!-- svelte-ignore a11y-invalid-attribute -->
		<h1 class="hidden text-3xl md:block">FamCoTree</h1>
	</a>
	<div class="navbar-end">
		<div class="dropdown">
			<!-- <div tabindex="-1" role="button" class="btn btn-circle btn-ghost">Export</div> -->

			<button class="btn btn-circle btn-ghost">
				<div class="indicator">
					<Icon icon="mdi:download" />
				</div>
			</button>
			<ul class="menu dropdown-content menu-sm z-[1] mt-3 rounded-box bg-base-100 p-2 shadow">
				<li><button on:click={downloadSVG}>SVG</button></li>
				<li><button on:click={downloadPNG}>PNG</button></li>
				<hr />
				<li>
					<button on:click={downloadCSV}>CSV</button>
				</li>
				<li class="disabled">
					<button class="btn-disabled">VCF</button>
				</li>
			</ul>
		</div>
		<div class="dropdown flex justify-center">
			<button class="btn btn-circle btn-ghost">
				<button class="indicator" on:click={shareQR}>
					<Icon icon="material-symbols:share" />
				</button>
			</button>
			<div
				class="  menu dropdown-content menu-sm z-[1] mr-40 mt-16 w-max rounded-box bg-base-100 p-2 shadow"
			>
				{#if loading}
					<div class="flex justify-center">
						<span class="loading loading-spinner loading-lg"></span>
					</div>
				{:else if qrCodeUrl}
					<img
						src={qrCodeUrl}
						alt="QR Code"
						class="my-4 self-center"
						style="width: 250px; height: 250px;"
					/>
					<div class="flex gap-2">
						<input type="text" value={fileLink} class="input input-bordered w-full" readonly />
						<button on:click={() => navigator.clipboard.writeText(fileLink)} class="btn"
							>Copy</button
						>
					</div>
				{/if}
			</div>
		</div>

		<div class="drawer-content">
			<label for="settings-drawer" class="btn btn-circle btn-ghost"
				><Icon icon="mdi:settings" /></label
			>
		</div>
	</div>
</div>

<div bind:this={FamCoTree} class="grow" />

<div class="drawer z-50">
	<input id="node-drawer" bind:checked={nodeDrawer} type="checkbox" class="drawer-toggle" />

	<div class="drawer-side">
		<label for="node-drawer" aria-label="close sidebar" class="drawer-overlay"></label>

		<aside class="menu w-80 bg-white p-4 text-base-content">
			<!-- Sidebar Header -->
			<h2 class="mb-4 text-center text-2xl font-bold">Contact Edit</h2>

			<!-- Sidebar Form -->
			<form class="form-control">
				<div class="avatar">
					<div class="w-fill mask mask-squircle">
						<img src={cForm.pic} alt="Contact" />
						<button
							class="absolute inset-0 flex cursor-pointer items-center justify-center bg-black bg-opacity-0 transition-all hover:bg-opacity-30"
							on:click={printLoc}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-8 w-8 text-white opacity-0 transition-opacity hover:opacity-100"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 12h14M12 5l7 7-7 7"
								/>
							</svg>
						</button>
					</div>
				</div>

				<div class="relative mt-4">
					<input
						type="text"
						id="dName"
						bind:value={cForm.name}
						on:input={fixdUID}
						placeholder=" "
						class="peer input h-12 w-full rounded-lg border-2 border-gray-300 px-4 pb-2 pt-1 focus:border-primary focus:outline-none focus:ring-0"
					/>
					<label
						for="dName"
						class="absolute left-4 top-0 -translate-y-1/2 transform bg-white px-1 transition-all duration-200
							peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
							peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-primary"
					>
						Name
					</label>
				</div>

				<div class="relative mt-4">
					<input
						type="text"
						id="dSurname"
						bind:value={cForm.surname}
						on:input={fixdUID}
						placeholder=""
						class="peer input h-12 w-full rounded-lg border-2 border-gray-300 px-4 pb-2 pt-1 focus:border-primary focus:outline-none focus:ring-0"
					/>
					<label
						for="dSurname"
						class="absolute left-4 top-0 -translate-y-1/2 transform bg-white px-1 transition-all duration-200
							peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
							peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-primary"
					>
						Surname
					</label>
				</div>
				<div class="collapse collapse-plus">
					<input
						type="checkbox"
						checked={openNames}
						on:change={() => (openNames = !openNames)}
						class="peer"
					/>
					<div class="collapse-title text-xs font-medium">
						{openNames ? 'Less' : 'More options'}
					</div>
					<div class="collapse-content">
						{#if openNames}
							<div class="relative">
								<input
									type="text"
									id="dPrefix"
									bind:value={cForm.prefix}
									placeholder=""
									class="peer input h-12 w-full rounded-lg border-2 border-gray-300 px-4 pb-2 pt-3 focus:border-primary focus:outline-none focus:ring-0"
								/>
								<label
									for="dPrefix"
									class="absolute left-4 top-0 -translate-y-1/2 transform bg-white px-1 transition-all duration-200
							peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
							peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-primary"
								>
									Prefix
								</label>
							</div>
							<div class="relative mt-4">
								<input
									type="text"
									id="dSuffix"
									bind:value={cForm.suffix}
									placeholder=""
									class="peer input h-12 w-full rounded-lg border-2 border-gray-300 px-4 pb-2 pt-1 focus:border-primary focus:outline-none focus:ring-0"
								/>
								<label
									for="dSuffix"
									class="absolute left-4 top-0 -translate-y-1/2 transform bg-white px-1 transition-all duration-200
							peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
							peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-primary"
								>
									Suffix
								</label>
							</div>

							<div class="relative mt-4">
								<input
									type="text"
									id="dNickname"
									bind:value={cForm.nickname}
									placeholder=""
									class="peer input h-12 w-full rounded-lg border-2 border-gray-300 px-4 pb-2 pt-1 focus:border-primary focus:outline-none focus:ring-0"
								/>
								<label
									for="dNickname"
									class="absolute left-4 top-0 -translate-y-1/2 transform bg-white px-1 transition-all duration-200
							peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
							peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-primary"
								>
									Nickname
								</label>
							</div>
						{/if}
					</div>
				</div>

				<div class="relative">
					<input
						type="date"
						id="dBorn"
						bind:value={cForm.born}
						on:input={fixdUID}
						placeholder=""
						class="peer input h-12 w-full rounded-lg border-2 border-gray-300 px-4 pb-2 pt-2 focus:border-primary focus:outline-none focus:ring-0"
					/>
					<label
						for="dBorn"
						class="absolute left-4 top-0 -translate-y-1/2 transform bg-white px-1 transition-all duration-200
							peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
							peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-primary"
					>
						Birth date
					</label>
					{#if cForm.born}
						<button
							type="button"
							class="absolute right-12 top-4 text-gray-400 hover:text-red-500"
							on:click={() => {
								cForm.born = '';
								fixdUID();
							}}
						>
							&#10005; <!-- Clear button moved to the left -->
						</button>
					{/if}
				</div>
				<div class="relative mt-4">
					<input
						type="date"
						id="dDied"
						bind:value={cForm.died}
						placeholder=""
						class="peer input h-12 w-full rounded-lg border-2 border-gray-300 px-4 pb-2 pt-2 focus:border-primary focus:outline-none focus:ring-0"
					/>
					<label
						for="dDied"
						class="absolute left-4 top-0 -translate-y-1/2 transform bg-white px-1 transition-all duration-200
							peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
							peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-primary"
					>
						Death date
					</label>
					{#if cForm.died}
						<button
							type="button"
							class="absolute right-12 top-4 text-gray-400 hover:text-red-500"
							on:click={() => (cForm.died = '')}
						>
							&#10005; <!-- Clear button moved to the left -->
						</button>
					{/if}
				</div>

				<div class="relative mt-4">
					<input
						type="text"
						id="dUID"
						bind:value={cForm.key}
						placeholder=""
						disabled={lockUID}
						class="peer input h-12 w-full rounded-lg border-2 border-gray-300 px-4 pb-2 pt-1 text-center"
					/>
					<label
						for="dUID"
						class="absolute left-4 top-0 -translate-y-1/2 transform bg-gray-100 px-1 transition-all duration-200
							peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
							peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-primary"
					>
						UID
					</label>
				</div>
				<div class="relative mt-4">
					<input
						type="text"
						id="dPosition"
						bind:value={cForm.position}
						placeholder=""
						disabled
						class="peer input h-12 w-full rounded-lg border-2 border-gray-300 px-4 pb-2 pt-1 text-center"
					/>
					<label
						for="dPosition"
						class="absolute left-4 top-0 -translate-y-1/2 transform bg-gray-100 px-1 transition-all duration-200
							peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
							peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-primary"
					>
						Position
					</label>
				</div>
				<button on:click={saveContact} class="btn btn-primary mt-4">Update</button>
			</form>
		</aside>
	</div>
</div>

<div class="drawer drawer-end z-50">
	<input id="settings-drawer" type="checkbox" class="drawer-toggle" />

	<div class="drawer-side">
		<label for="settings-drawer" aria-label="close sidebar" class="drawer-overlay"></label>

		<aside class="menu w-80 bg-white p-4 text-base-content">
			<!-- Sidebar Header -->
			<h2 class="mb-4 text-center text-2xl font-bold">Settings</h2>

			<!-- Sidebar Form -->
			<div class="form-control">
				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="text-base">Dark mode</span>
						<label class="grid cursor-pointer place-items-center">
							<input
								type="checkbox"
								value="synthwave"
								class="theme-controller toggle col-span-2 col-start-1 row-start-1 bg-base-content"
							/>
							<svg
								class="col-start-1 row-start-1 fill-base-100 stroke-base-100"
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<circle cx="12" cy="12" r="5" />
								<path
									d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
								/>
							</svg>
							<svg
								class="col-start-2 row-start-1 fill-base-100 stroke-base-100"
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
							</svg>
						</label>
					</label>
					<hr />

					<div class="mt-4 flex items-center justify-between">
						<label class="cursor-pointer text-base" for="colorPicker">Diagram color</label>
						<input
							type="color"
							id="colorPicker"
							bind:value={diagramColor}
							on:input={updateDiagramColor}
							class=" ml-2 h-8 w-8 cursor-pointer"
						/>
					</div>

					<div class="relative mt-4">
						<select
							id="dContactStyle"
							bind:value={diagramContactStyle}
							class="peer select h-12 w-full rounded-lg border-2 border-gray-300 px-4 pb-2 pt-1 focus:border-primary focus:outline-none focus:ring-0"
							placeholder=" "
						>
							<option selected>Simple</option>
						</select>
						<label
							for="dOption"
							class="absolute left-4 top-0 -translate-y-1/2 transform bg-white px-1 transition-all duration-200
							peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
							peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-primary"
						>
							Diagram contact style
						</label>
					</div>
					<div class="relative mb-4 mt-4">
						<select
							id="dRelationStyle"
							bind:value={diagramRelationStlye}
							on:change={changeRelationStyle}
							class="peer select h-12 w-full rounded-lg border-2 border-gray-300 px-4 pb-2 pt-1 focus:border-primary focus:outline-none focus:ring-0"
							placeholder=" "
						>
							<option selected value={go.Link.Bezier}>Free Hand</option>
							<option value={go.Link.JumpOver}>Boxy Jump</option>
							<option value={go.Link.JumpGap}>Boxy Gap</option>
						</select>
						<label
							for="dOption"
							class="absolute left-4 top-0 -translate-y-1/2 transform bg-white px-1 transition-all duration-200
							peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
							peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-primary"
						>
							Diagram relation style
						</label>
					</div>
					<hr />

					<label class="label cursor-pointer">
						<span class="label-text">Readonly UID</span>
						<input type="checkbox" bind:checked={lockUID} class="toggle toggle-primary" />
					</label>
					<label class="label cursor-pointer">
						<span class="label-text">Auto update UID</span>
						<input type="checkbox" bind:checked={autoUpdateUID} class="toggle toggle-primary" />
					</label>

					<hr />
					<button on:click={removeAllRelations} class="btn btn-error mt-4"
						>Delete all {linkCount} relations</button
					>
					<button on:click={removeAllContacts} class="btn btn-error mt-4"
						>Delete all {nodeCount} contacts</button
					>
				</div>
			</div>
		</aside>
	</div>
</div>

<style>
	/*
        Cannot target component in CSS, target SVG
        instead using Svelte's :global() function
    */
	div :global(svg) {
		font-size: 24px;
		line-height: 1em;
	}

	/*
        Must use :global() because Svelte cannot assign style to a
        component by class name, it can only work with standard HTML tags.
    */
	div :global(.big-icon) {
		font-size: 72px;
	}
</style>
