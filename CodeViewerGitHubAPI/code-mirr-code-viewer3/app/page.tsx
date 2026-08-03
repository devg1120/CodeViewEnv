"use client";
import { Octokit } from "octokit";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Content, RepositoryRequest } from "./types.interface";
import { fetchContent, fetchDir, fetchRepository } from "./funcs";

import { javascript } from "@codemirror/lang-javascript";

// https://github.com/uiwjs/react-codemirror/tree/master/themes
// https://www.npmjs.com/package/@uiw/codemirror-themes
//
import ReactCodeMirror from "@uiw/react-codemirror";
import { EditorView } from '@codemirror/view';

import { xcodeDark } from "@uiw/codemirror-theme-xcode";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { dracula } from '@uiw/codemirror-theme-dracula';
import { material } from '@uiw/codemirror-theme-material';
import { sublime } from '@uiw/codemirror-theme-sublime';


const HeaderToolBar = ({
  setFontSize,
  setTheme,
}: {
  setFontSize: Dispatch<SetStateAction<{ data: Content[] }>>;
  setTheme: Dispatch<SetStateAction<{ data: Content[] }>>;
}) => {
return (
      <div class="flex flwx-row">
        <h1>TOP TOOL</h1>
	<label class="ml-40">FontSize</label>
	<input class="ml-4 w-14 text-center" type="number" name="num" value="18"/>
	<label class="ml-10">Theme</label>
        <select class="ml-4 w-40" name="pets" id="pet-select" value="spider">
         <option value="">Theme</option>
         <option value="dog">犬</option>
         <option value="cat">猫</option>
         <option value="hamster">ハムスター</option>
         <option value="parrot">オウム</option>
         <option value="spider">クモ</option>
         <option value="goldfish">金魚</option>
        </select>
      </div>

)}

const TreeNode = ({
  item,
  setContent,
  setRepo,
  repo,
  isOpened,
}: {
  item: Content;
  setContent: Dispatch<SetStateAction<Content>>;
  setRepo: Dispatch<SetStateAction<{ data: Content[] }>>;
  repo: Content[];
  isOpened: boolean;
}) => {
  const [subItemsOpened, setSubItemsOpened] = useState(item.isOpened);
  const treeDepth = item.path.split("/").length - 1;

  // const recursive = (repoItem: Content): any => {
  //   if (repoItem.path === item.path) {
  //     return {
  //       ...repoItem,
  //       isOpened: true,
  //     };
  //   }
  //   return repoItem.children ? {
  //     ...repoItem,
  //     children: repoItem.children.map((child) => {
  //       return recursive(child)
  //     }),
  //   } : repoItem;
  // }

  if (item.type === "file") {
    return (
      <div
        key={item.name}
        className={`${
          isOpened ? "" : "hidden"
        } text-white relative cursor-pointer hover:text-blue-600`}
        style={{
          marginLeft: `${treeDepth * 10}px`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setContent(item);
        }}
      >
        <div className=" h-[1px] top-1/2 -left-[20px] bg-white absolute"></div>
        {item.name}
      </div>
    );
  }
  // console.log(treeDepth)
  return (
    <div
      className={`text-white relative ${
        isOpened ? "" : "hidden"
      } hover:text-slate-400 cursor-pointer`}
      style={{
        marginLeft: `${treeDepth * 10}px`,
        zIndex: treeDepth,
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSubItemsOpened(!subItemsOpened);
      }}
    >
      {item.name}
      <div>
        {item.children?.map((child) => (
          <TreeNode
            isOpened={subItemsOpened}
            repo={repo}
            setRepo={setRepo}
            setContent={setContent}
            key={child.name}
            item={child}
          />
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const [content, setContent] = useState<Content>({} as Content);
  const [sourceCode, setSourceCode] = useState("");
  const [theme, setTheme] = useState(dracula);
  const [fontSize, setFontSize] = useState(18);
  const [selectedContent, setSelectedContent] = useState<{
    data: any;
    extension: string;
    size: number;
  }>({
    code:"",
    data: [],
    extension: "",
    size: 0,
  });
  const [repo, setRepo] = useState<{
    data: Content[];
  }>({
    data: [],
  });

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop();
  };

  console.log(repo);

  const octokit = new Octokit({
    auth: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
  });

  useEffect(() => {
    const fetchRepo = async () => {
      const { data } = await fetchRepository(octokit);

      const finalData = data.map((item: any) => {
        return {
          ...item,
          isOpened: item.type === "dir" ? false : true,
        };
      });
      console.log("fetchRepo", finalData);

      setRepo({ data: finalData });
    };
    fetchRepo();
  }, []);

 function decode(str) {
  const utf8Array = Uint8Array.from(
    Array.from(atob(str)).map((s) => s.charCodeAt(0)),
  );
  return new TextDecoder().decode(utf8Array);
 }

  useEffect(() => {
    const fetch = async () => {
      if (!content.path) return;

      const data = await fetchContent(octokit, content.path);

      //console.log("============",atob(data.content));
      //setSourceCode(atob(data.content));
      setSourceCode(decode(data.content));

      const fileExtension = getFileExtension(content.name);
      if (!fileExtension) return;

      if (
        fileExtension === "png" ||
        fileExtension === "jpg" ||
        fileExtension === "jpeg" ||
        fileExtension === "ico" ||
        fileExtension == "webp"
      ) {
        setSelectedContent({
          data: [data.size > 1000000 ? data.download_url : data.content],
          extension: fileExtension,
          size: data.size,
        });
        return;
      }

      const final = atob(data.content).split("\n");

      // console.log(final);

      setSelectedContent({
        data: final,
        extension: fileExtension,
        size: data.size,
      });
    };
    fetch();
  }, [content]);

  const customTheme = EditorView.theme({
  "&": {
    fontSize: "18px"
  }
});
/*
      <HeaderToolBar
            className="w-full"
           setFontSize={null}
           setTheme={null}
      />
*/
  return (
  <div className="flex flex-col  w-full ">
    <div className="w-full bg-gray-400 sticky top-0 h-14 z-50 flex items-center ">
      <HeaderToolBar
           setFontSize={null}
           setTheme={null}
      />
    </div>
    <div className="flex bg-black w-full h-full">
      <div className="flex w-[340px]  flex-col h-screen overflow-y-scroll overflow-x-auto">
        {repo.data.map((item) => {
          return (
            <TreeNode
              isOpened={true}
              repo={repo.data}
              setRepo={setRepo}
              setContent={setContent}
              key={item.name}
              item={item}
            />
          );
        })}
      </div>
    <div className="bg-black w-full h-screen ">
      <ReactCodeMirror
        value={sourceCode}
        //onChange={onChange}
	//theme={xcodeDark}
	//theme={vscodeDark}
	theme={dracula}
	fontSize={20}
	//theme={material}
	//theme={sublime}
       extensions={[javascript({ jsx: true }), customTheme]}
  width={"80vw"}
  height={"80vh"}
  //minHeight={"70vh"}
  //maxHeight={"80vh"}
  //minWidth={"40vw"}
  //maxWidth={"80vw"}
  autoFocus={false}
  editable={ false}
  readOnly={ true}
      />

    </div>
    </div>
  </div>
  );
}
