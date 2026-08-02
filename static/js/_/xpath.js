console.log("xpath.js is called!");
//構造解析用の関数を登録
// https://qiita.com/sho_U/items/088d15d38176b82dce00
document.getElementsByXPath = function (expression, parentElement) {
	if (parentElement) { document.body }
	if (parentElement === undefined || parentElement === null) { return; }
	let r = [];
	let x = document.evaluate(expression, parentElement || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
	for (let i = 0, l = x.snapshotLength; i < l; i++) {
		r.push(x.snapshotItem(i));
	}
	return r
}

function search_text(t) {
	return document.getElementsByXPath(`//*[contains(text(),"${t}")]`, document.body);
}

function search_text_range(t) {
	let node_list = search_text(t);
	for (let i = 0; i < node_list.length; i++) {
		//1つのNodeに複数あった場合は？
		let node = node_list[i];
		let t_length = t.length;
		let t_position = 0;
		while (true) {
			t_position = $(node).text().trim().indexOf(t, t_position)
			const range = new Range();
			range.setStart(node, t_position);
			range.setEnd(node, t_position + t_length);

			if (t_position === -1) { break; }
			t_position++;
		}
	}
}