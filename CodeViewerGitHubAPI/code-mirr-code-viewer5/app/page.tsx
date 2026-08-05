"use client";
import { Octokit } from "octokit";
import { Dispatch, SetStateAction, useEffect, useState, useMemo } from "react";
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
import { atomone } from '@uiw/codemirror-theme-atomone';
import { copilot } from '@uiw/codemirror-theme-copilot';
import { abcdef } from '@uiw/codemirror-theme-abcdef';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';

import PopUp from './PopUp.tsx';

/*
import {
  xcodeDark,
  vscodeDark,
  dracula,
  material,
  sublime,
}  from '@uiw/codemirror-themes-all';
*/

const theme_dict = {
 xcodeDark   :xcodeDark,
 vscodeDark  :vscodeDark,
 dracula     :dracula,
 material    :material,
 sublime     :sublime,
 atomone     :atomone,
 copilot     :copilot,
 abcdef      :abcdef,
 githubLight :githubLight,
 githubDark  :githubDark,
 tokyoNight  :tokyoNight,
};

const repo_dict = {
 "solidjs-lesson"   :"solidjs-lesson",
 "_bstools"         :"_bstools",
};

/*
import {
abcdef,
abyss,
androidstudio,
andromeda,
atomone,
aura,
basic,
bbedit,
bespin,
copilot,
darcula,
dracula,
duotone,
eclipse,
github,
gruvbox-dark,
kimbie,
material,
monokai,
monokai-dimmed,
noctis-lilac,
nord,
okaidia,
quietlight,
red,
solarized,
sublime,
tokyo-night,
tokyo-night-storm,
tokyo-night-day,
tomorrow-night-blue,
vscode,
white,
code,
}  from '@uiw/codemirror-themes-all';
*/


//const repo = "solidjs-lesson"

const HeaderToolBar = ({
  setViewFontSize,
  setViewThemeName,
  viewFontSize,
  viewThemeName,
  setViewRepoName,
  viewRepoName,
}: {
  //setFontSize: Dispatch<SetStateAction<{ data: Content[] }>>;
  //setTheme: Dispatch<SetStateAction<{ data: Content[] }>>;
}) => {

  //const [fontSize, setFontSize] = useState(18);
  const [fontSize, setFontSize] = useState(viewFontSize);
  //const [theme, setTheme] = useState("dracula");
  //const [theme, setTheme] = useState("atomone");
  //const [theme, setTheme] = useState("tokyoNight");
  const [theme, setTheme] = useState(viewThemeName);
  const [repo, setRepo] = useState(viewRepoName);

  const fontSizeChange = (e) => {
    console.log("fontSizeChange:",Number(e.target.value));
    setFontSize(Number(e.target.value));
    setViewFontSize(Number(e.target.value));
  };
  
  const themeChange = (e) => {
    console.log("themeChange:",e.target.value);
    setTheme(e.target.value);
    setViewThemeName(e.target.value);
  };

  const repoChange = (e) => {
    console.log("repoChange:",e.target.value, repo_dict[e.target.value]);
    setRepo(e.target.value);
    setViewRepoName(repo_dict[e.target.value]);
  };

   const [isPopUpVisible, setPopUpVisible] = useState(false);

  const togglePopUp = () => {
    setPopUpVisible(!isPopUpVisible);
  };

  /*
	<input class="ml-4 w-14 text-center" type="number" name="num"   onChange={fontSizeChange}  />
   */
return (
      <div className="flex flwx-row">
        <h1>TOP TOOL</h1>

	<label className="ml-10">Repo</label>
        <select className="ml-4 w-40 pl-1 text-left"  value={repo}  onChange={repoChange}>
	{/*
         <option value="xcodeDark">xcodeDark</option>
         <option value="vscodeDark">vscodeDark</option>
         <option value="dracula">dracula</option>
         <option value="material">material</option>
         <option value="sublime">sublime</option>
	*/}
	
          {Object.entries(repo_dict).map(([key, value]) => (
              <option value={key} key={key} >{key}</option>
          ))}
	
        </select>
	
	<label className="ml-40">FontSize</label>
	<input className="ml-4 w-14 text-center" type="number" name="num" value={fontSize}   onChange={fontSizeChange}  />
	
	
	<label className="ml-10">Theme</label>
        <select className="ml-4 w-40 pl-1 text-left"  value={theme}  onChange={themeChange}>
	{/*
         <option value="xcodeDark">xcodeDark</option>
         <option value="vscodeDark">vscodeDark</option>
         <option value="dracula">dracula</option>
         <option value="material">material</option>
         <option value="sublime">sublime</option>
	*/}
	
          {Object.entries(theme_dict).map(([key, value]) => (
              <option value={key} key={key} >{key}</option>
          ))}
	
        </select>

        <div className="ml-10" >
           <PopUp />
	</div>
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
  //const [viewRepoName, setViewRepoName] = useState("solidjs-lesson");
  const [viewRepoName, setViewRepoName] = useState("_bstools");
  const [sourceCode, setSourceCode] = useState("");

  const [viewFontSize, setViewFontSize] = useState(20);
  //const [viewTheme, setViewThema] = useState(dracula);
  const [viewThemeName, setViewThemeName] = useState("githubDark");
  //const [viewThemeName, setViewThemeName] = useState("tokyoNight");

  const viewTheme = useMemo(() => {
/*
        if (viewThemeName == "xcodeDark") { return xcodeDark; 
        } else if (viewThemeName == "vscodeDark") { return vscodeDark; 
        } else if (viewThemeName == "dracula"   ) { return dracula; 
        } else if (viewThemeName == "material"  ) { return material; 
        } else if (viewThemeName == "sublime"   ) { return sublime; 
	} else {
		return dracula;
	}
*/
        for (let [key, value] of Object.entries(theme_dict)) {
             if (viewThemeName == key) {
                  return value
             }
        }
	return dracula;

   }, [viewThemeName]);


  //const [viewTheme, setViewThema] = useState(sublime);
  //const [viewTheme, setViewThema] = useState(vscodeDark);

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
      //const { data } = await fetchRepository(octokit , "solidjs-lesson");
      const { data } = await fetchRepository(octokit , viewRepoName);
      console.log("fetchRepo: ", viewRepoName)

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
  }, [viewRepoName]);

 function decode(str) {
  const utf8Array = Uint8Array.from(
    Array.from(atob(str)).map((s) => s.charCodeAt(0)),
  );
  return new TextDecoder().decode(utf8Array);
 }

  useEffect(() => {
    const fetch = async () => {
      if (!content.path) return;

      //const data = await fetchContent(octokit, "solidjs-lesson", content.path);
      const data = await fetchContent(octokit, viewRepoName , content.path);

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
    //fontSize: "18px"
    fontSize: viewFontSize + "px"
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
           setViewFontSize={setViewFontSize}
           setViewThemeName={setViewThemeName}
           viewFontSize={viewFontSize}
           viewThemeName={viewThemeName}
           setViewRepoName={setViewRepoName}
           viewRepoName={viewRepoName}
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
	//theme={dracula}
	theme={viewTheme}
	fontSize={viewFontSize}
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
