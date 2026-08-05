import { Octokit } from "octokit";
import { ContentRequest, RepositoryRequest } from "./types.interface";

const carlos = "carlosd035";
const repoCarlos = "rest-api";

//const pedro = "pedroacamargo"
//const repoPedro = "animations"

//const pedro = "devg1120"
//const repoPedro = "_bstools"
//const repoPedro = "solidjs-lesson"

const actual = "devg1120";
//const actualRepo = repoPedro;
//const actualRepo = "solidjs-lesson";

const PersonalAccessToken = process.env.NEXT_PUBLIC_GITHUB_PersonalAccessToken

export const fetchDir = async (octokit: Octokit, repo: string, sha: string) => {
   console.log("-----fetchDir")
  const data = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    {
      owner: actual,
      //repo: actualRepo,
      //repo: "solidjs-lesson",
      repo: repo,
      tree_sha: sha,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
        'Authorization': `token ${PersonalAccessToken}`

      },
    }
  );
  //console.log("fetchDir", data.data);
  return data.data;
};

export const fetchRepository = async (octokit: Octokit , repo:string,  path: string = "") => {
	console.log("repo",repo)
  const data = (await octokit.request(
    "GET https://api.github.com/repos/{owner}/{repo}/contents/{path}",
    {
      owner: actual,
      //repo: actualRepo,
      //repo: "solidjs-lesson",
      repo: repo,
      path: path,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
        'Authorization': `token ${PersonalAccessToken}`
      },
    }
  )) as RepositoryRequest;
  
  //console.log("fetchRepository", data);

  const res: any = {
    data: await Promise.all(
      data.data.map(async (item) => {
        if (item.type === "dir") {
          const children = (await fetchRepository(octokit, repo, item.path)).data;
          return {
            ...item,
            isOpened: false,
            children,
          };
        }
        return {
          ...item,
          isOpened: false,
        }
      })
    ),
  };

  return res;
};

export const fetchTreeRecursively = async (octokit: Octokit  , repo:string) =>
  await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1",
    {
      owner: actual,
      //repo: actualRepo,
      //repo: "solidjs-lesson",
      repo: repo,
      tree_sha: "6ae8078bb48be972922895eb879bdcdd9c68e8ce",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
        'Authorization': `token ${PersonalAccessToken}`
      },
    }
  );


export const fetchContent = async (octokit: Octokit, repo: string, path: string) => {
  const data = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner: actual,
      //repo: actualRepo,
      //repo: "solidjs-lesson",
      repo: repo,
      path: path,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
        'Authorization': `token ${PersonalAccessToken}`
      },
    }
  ) as ContentRequest;

  // console.log("fetchContent", data.data);
  return data.data;
};
