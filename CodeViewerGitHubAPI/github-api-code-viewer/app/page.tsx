"use client";
import { Octokit } from "octokit";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Content, RepositoryRequest } from "./types.interface";
import { fetchContent, fetchDir, fetchRepository } from "./funcs";

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
  const [selectedContent, setSelectedContent] = useState<{
    data: any;
    extension: string;
    size: number;
  }>({
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

  useEffect(() => {
    const fetch = async () => {
      if (!content.path) return;

      const data = await fetchContent(octokit, content.path);

      console.log(data);

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

  return (
    <div className="bg-black w-full min-h-screen pt-12">
      <div className="flex flex-col border-l-2 border-l-white pl-[20px] pt-[10px] ml-12 gap-1 relative">
        <div className="w-[10px] h-[10px] bg-white absolute -left-[5px] -top-[5px]"></div>
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
      <div className="max-w-screen text-white mt-12 p-12">
        {selectedContent.size > 104857600 ? (
          <h1 className="text-2xl text-white">
            File is too large to display
          </h1>
        ) :
        content.type === "file" &&
          (selectedContent.extension === "png" ||
            selectedContent.extension === "jpg" ||
            selectedContent.extension === "jpeg" ||
            selectedContent.extension === "ico" ||
            selectedContent.extension == "webp") &&
          selectedContent.data.length > 0 ? (
          <div className="w-full">
            <h1 className="text-2xl text-white">{content.name}</h1>
            <img src={selectedContent.size > 1000000 ? selectedContent.data : `data:image/png;base64,${selectedContent.data}`} alt="" />
          </div>
        ) : content.type === "file" && selectedContent.data.length > 0 ? (
          <div className="w-full">
            <h1 className="text-2xl text-white">{content.name}</h1>
            <div className="text-white whitespace-pre-wrap break-words">
              {selectedContent.data.map((item: string, index: number) => (
                <div key={index} className="flex break-words">
                  <div className="mr-2">{index}: </div>
                  <div className="break-words w-full">{item}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
