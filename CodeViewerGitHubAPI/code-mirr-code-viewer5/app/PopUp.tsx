// components/PopUp.js
import React, { useState } from "react";
import styles from "./PopUp.module.css";


function EditTable() {
  const [data, setData] = useState([
    { id: 1, name: "佐藤", role: "管理者" },
    { id: 2, name: "鈴木", role: "一般" },
  ]);

  const [editRowId, setEditRowId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "" });

  // 編集開始
  const handleEditClick = (row) => {
    setEditRowId(row.id);
    setEditForm({ name: row.name, role: row.role });
  };

  // 入力値変更
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // 保存
  const handleSave = (id) => {
    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...editForm } : row))
    );
    setEditRowId(null);
  };

  // キャンセル
  const handleCancel = () => {
    setEditRowId(null);
  };

  return (
    <table>
      <thead>
        <tr>
          <th>名前</th>
          <th>権限</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            {editRowId === row.id ? (
              <>
                <td>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="role"
                    value={editForm.role}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <button onClick={() => handleSave(row.id)}>保存</button>
                  <button onClick={handleCancel}>取消</button>
                </td>
              </>
            ) : (
              <>
                <td>{row.name}</td>
                <td>{row.role}</td>
                <td>
                  <button onClick={() => handleEditClick(row.id || row)}>編集</button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}


function EditableTable() {
  const [data, setData] = useState([
    { id: 1, name: "Taro", email: "taro@example.com" },
    { id: 2, name: "Hanako", email: "hanako@example.com" },
  ]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  const handleEdit = (row) => {
    setEditId(row.id);
    setEditForm({ name: row.name, email: row.email });
  };

  const handleSave = (id) => {
    setData(data.map((row) => (row.id === id ? { ...row, ...editForm } : row)));
    setEditId(null);
  };

  return (
    <table contentEditable={true}>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            {editId === row.id ? (
              <>
                <td>
                    {editForm.name}
                </td>
                <td>
                    {editForm.email}
                </td>
                <td><button onClick={() => handleSave(row.id)}>Save</button></td>
              </>
            ) : (
              <>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td><button onClick={() => handleEdit(row.id)}>Edit</button></td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}


const PopUp = () => {
  const [isPopUpVisible, setPopUpVisible] = useState(false);

  const togglePopUp = () => {
    setPopUpVisible(!isPopUpVisible);
  };

  return (
    <div>
      <button onClick={togglePopUp}>Setting</button>

      {isPopUpVisible && (
        <div className={styles.PopUp}>
          {/* ポップアップの中身 */}
          <p>ここにポップアップの内容を記述します。</p>
	  <EditTable/>
          <button onClick={togglePopUp}>Close</button>
        </div>
      )}
    </div>
  );
};

export default PopUp;

