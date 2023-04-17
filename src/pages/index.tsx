import { Devonshire, Inter } from "next/font/google";
import Image from "next/image";

import DATA from "@/database.json";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export default function Home() {
  const [formId, setFormId] = useState<number | null>(null);

  return (
    <main className="bg-slate-100 min-h-screen py-16">
      <div className="container mx-auto">
        <div className="flex flex-col gap-4">
          <Form id={formId} setFormId={setFormId} />
          <Table setFormId={setFormId} />
        </div>
      </div>
    </main>
  );
}

const Form = (props: {
  id: number | null;
  setFormId: Dispatch<SetStateAction<number | null>>;
}) => {
  const [form, setForm] = useState<{
    heading: string;
    content: string;
  }>({
    heading: "",
    content: "",
  });

  const queryClient = useQueryClient();
  const { isFetching } = useQuery(
    ["post", props.id],
    () => {
      if (!props.id) return null;

      return fetch(`/api/post/${props.id}`).then((res) => res.json());
    },
    {
      enabled: !!props.id,
      onSuccess: (data) => {
        setForm(data);
      },
    }
  );

  useEffect(() => {
    if (!props.id) {
      setForm({
        heading: "",
        content: "",
      });
    }
  }, [props.id]);

  const { mutate: create, isLoading: isCreating } = useMutation(
    async (data: typeof form) => {
      const res = await fetch("/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return await res.json();
    },
    {
      onSuccess: (data) => {
        setForm({
          heading: "",
          content: "",
        });

        // do cache přidáme nový post
        queryClient.setQueryData(["post", data.id], data);

        // ručně přepíšeme data v cache pro cache key "post"
        queryClient.setQueryData(["post"], (old: any) => {
          return [data, ...old];
        });

        // nebo můžeme zavolat refetch
        // await queryClient.refetchQueries(["post"]);
      },
    }
  );

  const { mutate: update, isLoading: isUpdating } = useMutation(
    async (data: typeof form) => {
      const res = await fetch(`/api/post/${props.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return await res.json();
    },
    {
      onSuccess: async (data) => {
        props.setFormId(null);

        // přepíšeme data v cache pro konkrétní post
        queryClient.setQueryData(["post", data.id], data);

        // nebo zavoláme refetch pro konkrétní post
        // await queryClient.refetchQueries(["post", data.id]);

        // ručně přepíšeme data v cache
        queryClient.setQueryData<typeof DATA>(["post"], (old) => {
          return old?.map((item) => {
            if (item.id === data.id) {
              return data;
            }
            return item;
          });
        });

        // nebo můžeme zavolat refetch
        // await queryClient.refetchQueries(["post"]);
      },
    }
  );

  if (isFetching) {
    return (
      <div className="bg-white shadow-md flex justify-center py-16 rounded">
        <Spinner size={60}></Spinner>
      </div>
    );
  }

  return (
    <form className="space-y-4 bg-slate-50 p-6 rounded shadow">
      <div className="flex justify-between">
        <h1 className="text-slate-600 font-bold text-xl">
          {props.id ? `Edit post no. ${props.id}` : `New post`}
        </h1>
        {props.id && (
          <button
            type="button"
            className="text-slate-600"
            onClick={() => {
              props.setFormId(null);
            }}
          >
            Cancel
          </button>
        )}
      </div>
      <div className="mb-6">
        <label
          htmlFor="email"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Your email
        </label>
        <input
          type="email"
          id="email"
          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
          placeholder="name@flowbite.com"
          required
          value={form.heading}
          onChange={(e) => {
            setForm((form) => ({
              ...form,
              heading: e.target.value,
            }));
          }}
        />
      </div>
      <div className="mb-6">
        <label
          htmlFor="message"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Your message
        </label>
        <textarea
          id="message"
          rows={4}
          className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Leave a comment..."
          value={form.content}
          onChange={(e) => {
            setForm((form) => ({
              ...form,
              content: e.target.value,
            }));
          }}
        ></textarea>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => {
            if (props.id) {
              update(form);
            } else {
              create(form);
            }
          }}
          disabled={isCreating || isUpdating}
        >
          {isCreating || isUpdating ? (
            <Spinner size={20}></Spinner>
          ) : props.id ? (
            "Update"
          ) : (
            "Create"
          )}
        </button>
      </div>
    </form>
  );
};

const Table = (props: {
  setFormId: Dispatch<SetStateAction<number | null>>;
}) => {
  const { data: posts, isLoading } = useQuery<typeof DATA>(["post"], () =>
    fetch("/api/post").then((res) => res.json())
  );

  const rows = posts?.map((post) => (
    <TableRow setFormId={props.setFormId} key={post.id} {...post} />
  ));

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Heading
            </th>
            <th scope="col" className="px-6 py-3">
              Content
            </th>
            <th scope="col" className="px-6 py-3">
              <span className="sr-only">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
};

const TableRow = (
  props: typeof DATA[number] & {
    setFormId: Dispatch<SetStateAction<number | null>>;
  }
) => {
  const { heading, content } = props;

  const queryClient = useQueryClient();

  const { mutate: remove, isLoading: isRemoving } = useMutation(
    () => fetch(`/api/post/${props.id}`, { method: "DELETE" }),
    {
      onSuccess: () => {
        // mažeme z cache ručně podle response
        queryClient.setQueryData<typeof DATA>(["post"], (old) => {
          return old?.filter((item) => item.id !== props.id);
        });

        // nebo můžeme zavolat refetch
        // queryClient.refetchQueries(["post"]);

        // smažeme post id z cache
        queryClient.removeQueries(["post", props.id]);
      },
    }
  );

  return (
    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
      <th
        scope="row"
        className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
      >
        {heading}
      </th>
      <td className="px-6 py-4">{content}</td>
      <td className="px-6 py-4 text-right">
        <button
          className="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-4"
          onClick={() => props.setFormId(props.id)}
        >
          Edit
        </button>
        <button
          className="font-medium text-red-600 dark:text-red-500 hover:underline inline-flex gap-4 items-center"
          onClick={() => remove()}
          disabled={isRemoving}
        >
          {isRemoving ? <Spinner size={20} /> : "Delete"}
        </button>
      </td>
    </tr>
  );
};

const Spinner = (props: { size: number }) => {
  return (
    <div role="status">
      <svg
        aria-hidden="true"
        className="mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={props.size}
        height={props.size}
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
};
